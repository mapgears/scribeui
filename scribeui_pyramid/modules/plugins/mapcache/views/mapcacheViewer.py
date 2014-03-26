import logging
import transaction

from pyramid.httpexceptions import (
    HTTPFound,
    HTTPNotFound
)
from pyramid.view import view_config

from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy import exc

log = logging.getLogger(__name__)

import pprint, sys, os

from .. import DBSession
from .. import Map
from .. import Workspace

from ..models import Job
class APIMapcacheViewer(object):
    def __init__(self, request):
        self.request = request
        self.matchdict = request.matchdict

    @view_config(
        route_name='mapcache.getLayers',
        permission='view',
        renderer='json',
        request_method='GET'
    )
    def getLayers(self):
        response = {
            'status': 0,
            'errors': [],
            'jobs': []
            }

        return response

 

