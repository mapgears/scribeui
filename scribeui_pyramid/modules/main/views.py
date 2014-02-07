# -*- coding: utf-8 -*-
import logging

from sqlalchemy.orm.exc import NoResultFound

from ..app.sqla import DBSession
from pyramid.httpexceptions import (
    HTTPFound,
    HTTPNotFound
)
from pyramid.view import view_config

from wtforms.validators import ValidationError

from ..webui.views import (
    BaseView,
    FormView
)

from ..app.utils import Bunch

from ..workspaces.models import Workspace

log = logging.getLogger(__name__)


class MainView(BaseView):

    def __init__(self, request):
        super(MainView, self).__init__(request)

    @view_config(
        route_name='home',
        renderer='scribeui_pyramid:modules/main/templates/home.jinja2',
        permission='view'
    )
    def home(self):
        plugins_js = [
            #self.request.static_url('scribeui_pyramid:static/js/test.js'),
            self.request.static_url('scribeui_pyramid:static/js/init.js')
        ]

        return {
            'plugins_js': plugins_js,
            'api_url': self.request.route_url('home') + '/api',
            'workspace': self.request.userid ,
            'logo': self.request.static_url('scribeui_pyramid:static/img/logo_mini.png'),
            'logout_url': self.request.route_url('auth.logout')
        }