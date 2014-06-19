# -*- coding: utf-8 -*-
import logging
import transaction

from wtforms import Form

from ..app import ValidationError

log = logging.getLogger(__name__)


class BaseView(object):
    def __init__(self, request):
        self.request = request
        self.matchdict = request.matchdict
        self.lm = request.layout_manager


class FormExtras(object):
    pass


class FormView(BaseView):

    sp = None

    title = u'Form'
    subtitle = None
    form_class = Form
    obj = None
    form_id = None
    action_url = None
    cancel_url = None
    buttons = ()
    tabs = ()
    omitted = ()
    disabled = ()
    table = None
    onload = None

    def __init__(self, request):
        super(FormView, self).__init__(request)

    def __call__(self):
        form = self.form_class()
        self.before(form)
        setattr(form, 'extras', self.form_extras())
        result = None

        for button in self.buttons:
            if button in self.request.POST:
                success = getattr(self, 'success_{0}'.format(button))
                if form.validate():
                    try:
                        result = success(form)
                    except ValidationError as ve:
                        self.request.session.flash(
                            ve,
                            queue='error'
                        )
                        result = None
                        transaction.abort()
                    except Exception as e:
                        log.exception("Critical Python Exception")

                        message = e.message if e.message != '' \
                            else "An error occured. Please contact the administrator."

                        self.request.session.flash(
                            message,
                            queue='error'
                        )
                        result = None
                        transaction.abort()
                else:
                    if hasattr(self, 'failure_{0}'.format(button)):
                        failure = getattr(self, 'failure_{0}'.format(button))
                    else:
                        failure = self.failure
                    result = failure(form)
                    break

        if result is None:
            result = self.show(form)
        return result

    def form_extras(self):
        extras = FormExtras()
        setattr(extras, 'request', self.request)
        setattr(extras, 'title', self.title)
        setattr(extras, 'subtitle', self.subtitle)
        setattr(extras, 'form_id', self.form_id)
        setattr(extras, 'action_url', self.action_url)
        setattr(extras, 'cancel_url', self.cancel_url)
        setattr(extras, 'buttons', self.buttons)
        setattr(extras, 'tabs', self.tabs)
        setattr(extras, 'table', self.table)
        setattr(extras, 'omitted', self.omitted)
        setattr(extras, 'disabled', self.disabled)
        setattr(extras, 'onload', self.onload)
        return extras

    def before(self, form):
        pass

    def failure(self, form):
        self.request.session.flash(
            u'An error occured.',
            queue='error'
        )
        return {
            'form': form
        }

    def show(self, form):
        return {
            'form': form
        }
