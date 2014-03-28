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

import pprint, sys, os, fnmatch

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
            'layers': []
            }
        try:
            mapID = self.request.GET.get('map')
        except KeyError as e:
            response['errors'].append('A map ID is required.')
            return response
        if mapID is None:
            response['errors'].append('A map ID is required.')
            return response
        try:
            map = Map.by_id(mapID)
        except NoResultFound, e:
            response['errors'].append('This map is unavailable or does not exist.')
            return response
        workspace = Workspace.by_id(map.workspace_id)
        if(workspace.name == self.request.userid):
            
            ##First, let's browse the folders to find some finished jobs.
            ## TODO: Add optional additional paths.
            paths = [];
            
            ## Add the default folder
            workspacesDirectory = self.request.registry.settings.get('workspaces.directory', '') + '/'
            mapDirectory = workspacesDirectory + self.request.userid + '/' + map.name + '/'
            mapcacheDirectory = mapDirectory+'mapcache/'
            paths.append(mapcacheDirectory)
            matches = []
            for path in paths:
                for root, dirnames, filenames in os.walk(path):
                    for filename in fnmatch.filter(filenames, 'mapcacheConfig.xml'):
                        matches.append(os.path.split(root)[1])
                        break
            response['layers'] = matches
        else:
           response['errors'].append('Access denied.')


        return response

    @view_config(
        route_name='mapcache.tiles',
        permission='view',
        renderer='json',
        request_method='GET'
    )
    def tiles(self):
        return "halp"
