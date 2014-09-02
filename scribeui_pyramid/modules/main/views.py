# -*- coding: utf-8 -*-
from scribeui_pyramid.modules import plugins

from pyramid.view import view_config

from ..webui.views import (
    BaseView
)


class MainView(BaseView):

    def __init__(self, request):
        super(MainView, self).__init__(request)

    @view_config(
        route_name='home',
        renderer='scribeui_pyramid:modules/main/templates/home.jinja2',
        permission='view'
    )
    def home(self):
        plugins_js = []
        plugins_css = []
        #config = Configurator(settings=get_current_registry().settings)
        #plugins = load_plugins()
        #for name, plugin in plugins.iteritems():
        #    config.include("..plugins."+name)

        plist = plugins.pluginsList
        for name in plist:
            try:
                plugin = __import__("scribeui_pyramid.modules.plugins."+name, globals(), locals(), ['getIncludedFiles'])
                includes = plugin.getIncludedFiles()
                #JS
                js_files = includes['js']
                if isinstance(js_files, str):
                    plugins_js.append(js_files)
                else:
                    for js in js_files:
                        plugins_js.append(js)
                #CSS
                css_files = includes['css']
                if isinstance(css_files, str):
                    plugins_css.append(css_files)
                else:
                    for css in css_files:
                        plugins_css.append(css)
            except AttributeError:
                #If the plugins doesn't have js files to include, ignore it.
                pass

        return {
            'plugins_js': plugins_js,
            'plugins_css': plugins_css,
            'api_url': self.request.route_url('home') + '/api',
            'workspace': self.request.userid ,
            'logo': self.request.static_url('scribeui_pyramid:static/img/logo_mini.png'),
            'logout_url': self.request.route_url('auth.logout'),
            'version': 'v1.2'
        }
