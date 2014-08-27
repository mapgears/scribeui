# -*- coding: utf-8 -*-
import logging

from pyramid.httpexceptions import HTTPFound
from pyramid.security import (
    authenticated_userid,
    forget,
    remember
)
from pyramid.view import (
    forbidden_view_config,
    view_config
)
from ..app.sqla import DBSession
from ..workspaces.models import Workspace
from ..webui.views import BaseView
from .forms import LoginForm

log = logging.getLogger(__name__)


class AuthView(BaseView):

    def __init__(self, request):
        super(AuthView, self).__init__(request)

    @view_config(
        route_name='auth.login',
        renderer='scribeui_pyramid:modules/auth/templates/login.jinja2'
    )
    @forbidden_view_config(renderer='scribeui_pyramid:modules/auth/templates/login.jinja2')
    def login(self):
        home_url = self.request.route_url('home')

        params = self.request.POST.copy()
        form = LoginForm(params)

        if params and form.validate():
            workspace = Workspace().authenticate(form.name.data, form.password.data)

            if workspace:
                log.info('Successful login for {0}'.format(form.name.data))
                headers = remember(self.request, workspace.name)
                return HTTPFound(location=home_url, headers=headers)
            else:
                self.request.session.flash(
                    'Wrong credentials!',
                    queue='warning'
                )
                log.warning('Failed login for {0}'.format(form.name.data))

        plugins_js = [
            self.request.static_url('scribeui_pyramid:static/js/login.js')
        ]

        workspaces = DBSession.query(Workspace.name).order_by(Workspace.name).all()

        return {
            'form': form,
            'plugins_js': plugins_js,
            'logo': self.request.static_url('scribeui_pyramid:static/img/logo.png'),
            'workspaces': workspaces
        }

    @view_config(route_name='auth.logout')
    def logout(self):
        login_url = self.request.route_url('auth.login')
        if not authenticated_userid(self.request):
            self.request.session.flash(
                'You are not connected!',
                queue='warning'
            )
            return HTTPFound(location=login_url)
        headers = forget(self.request)
        self.request.session.flash(
            'You have been logged out!',
            queue='success'
        )
        return HTTPFound(location=login_url, headers=headers)
