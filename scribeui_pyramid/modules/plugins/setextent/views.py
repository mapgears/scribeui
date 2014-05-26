# -*- coding: utf-8 -*-
import logging

from pyramid.httpexceptions import (
    HTTPFound,
    HTTPNotFound
)
from pyramid.view import view_config

log = logging.getLogger(__name__)

""" Uncomment those if needed """
#from .. import DBSession
#from .. import Map
#from .. import Workspace

"""
class SetExtent(object):

    def __init__(self, request):
        self.request = request
        self.matchdict = request.matchdict

    
    @view_config(
        route_name='setextent.test',
        renderer='json',
        request_method='POST'
    )
    def setextent_test(self):
        response = {
            'status': 0,
            'errors': [],
            }

        return response
"""