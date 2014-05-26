# -*- coding: utf-8 -*-
from sqlalchemy.orm.exc import NoResultFound

from pyramid.view import view_config
import pyramid.httpexceptions as exc

from ..app.sqla import DBSession

from operator import attrgetter

class APIBaseView(object):
    def __init__(self, request):
        self.request = request
        self.matchdict = request.matchdict

class API(APIBaseView):
    """API"""

    @view_config(
        route_name='api.dummy',
        renderer='json',
        request_method='GET'
    )
    def dummy(self):
        return {
        }
