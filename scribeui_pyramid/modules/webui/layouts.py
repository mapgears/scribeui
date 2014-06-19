# -*- coding: utf-8 -*-
from pyramid.settings import asbool

from pyramid_layout.layout import layout_config


@layout_config(
    name='base',
    template='scribeui_pyramid:modules/webui/templates/base.jinja2'
)
class BaseLayout(object):

    def __init__(self, context, request):
        self.context = context
        self.request = request
        self.home_url = request.application_url

    @property
    def is_fluid(self):
        return asbool(
            self.request.registry.settings.get('webui.fluid-layout', False))

    @property
    def fluid_css_class(self):
        if self.is_fluid:
            return '-fluid'
        return ''

    @property
    def title(self):
        return self.request.registry.settings.get('webui.title', '')

    @property
    def copyright(self):
        return self.request.registry.settings.get('webui.copyright', '')


@layout_config(template='scribeui_pyramid:modules/webui/templates/master.jinja2')
class MasterLayout(BaseLayout):

    def __init__(self, context, request):
        super(MasterLayout, self).__init__(context, request)
        self.page_actions = None
