# -*- coding: utf-8 -*-
import logging
import subprocess

from pyramid.httpexceptions import (
    HTTPFound,
    HTTPNotFound
)
from pyramid.view import view_config

from ..app.sqla import DBSession
from ..app.utils import Bunch
from ..webui.ui import (
    PageAction,
    FormTab
)
from ..webui.views import (
    BaseView,
    FormView
)
from .forms import (
    NewWorkspaceForm
)
from .models import Workspace
from . import WorkspaceManager

from ..maps import MapManager

log = logging.getLogger(__name__)


class APIWorkspace(object):

    def __init__(self, request):
        self.request = request
        self.matchdict = request.matchdict


    @view_config(
        route_name='workspaces.new',
        renderer='json',
        request_method='POST'
    )
    def new_workspace(self):
        response = {
            'status': 0,
            'errors': [],
            'id': ''
            }

        try:
            name = self.request.POST.get('name')
        except KeyError as e:
            response['errors'].append('A name is required.')

        try:
            password = self.request.POST.get('password')
        except KeyError as e:
            password = None

        if len(response['errors']) == 0:
            if not WorkspaceManager.is_valid_name(name):
                response['errors'].append('Name is not valid.')

            if Workspace.by_name(name):
                response['errors'].append('A workspace with that name already exists.')

            if len(response['errors']) == 0:
                workspaces_directory = self.request.registry.settings.get('workspaces.directory', '') + '/'
                workspace_directory = workspaces_directory + name

                try:
                    subprocess.call(['mkdir', workspace_directory]) 
                except subprocess.CalledProcessError as e:
                    response['errors'].append(e.output)

                if len(response['errors']) == 0:
                    kwargs = {
                        'name': name,
                        'password': Workspace.encode_password(password) if password else None
                    }

                    workspace = Workspace(**kwargs)

                    try:
                        DBSession.add(workspace)
                    except exc.SQLAlchemyError as e:
                        response['errors'].append(e)

                    if len(response['errors']) == 0:
                        response['status'] = 1
                    else:
                        try:
                            subprocess.call(['rm', '-r', workspace_directory]) 
                        except subprocess.CalledProcessError as e:
                            pass
                            
        return response


    @view_config(
        route_name='workspaces.delete',
        renderer='json',
        request_method='POST'
    )
    def delete_workspace(self):
        response = {
            'status': 0,
            'errors': []
            }

        try:
            name = self.request.POST.get('name')
        except KeyError as e:
            response['errors'].append("You're not telling me which workspace to delete.")

        try:
            password = self.request.POST.get('password')
        except KeyError as e:
            password = None

        if len(response['errors']) == 0:
            workspace = Workspace.authenticate(name, password)

            if workspace:
                workspace_directory = self.request.registry.settings.get('workspaces.directory', '') + '/' + name

                try:
                    subprocess.call(['rm','-r', workspace_directory]) 
                except subprocess.CalledProcessError as e:
                    response['errors'].append(e.output)

                if len(response['errors']) == 0:

                    maps = workspace.get_maps()

                    for map in maps:
                        connector_file = self.request.registry.settings.get('cgi.directory', '') + \
                            '/elfinder-python/connector-' + name + '-' + map.name + '.py'
                    
                        try:
                            subprocess.call(['rm', connector_file]) 
                        except subprocess.CalledProcessError as e:
                            response['errors'].append(e.output)

                        if len(response['errors']) == 0:
                            try:
                                DBSession.delete(map)
                            except exc.SQLAlchemyError as e:
                                response['errors'].append(e)

                    if len(response['errors']) == 0:
                        try:
                            DBSession.delete(workspace)
                            response['status'] = 1
                        except exc.SQLAlchemyError as e:
                            response['errors'].append(e)    

            else:
                response['errors'].append('Access denied.')

        return response


    #Return the list of workspaces         
    @view_config(
        route_name='workspaces.all',
        permission='view',
        renderer='json',
        request_method='GET'
    )
    def all(self):
        response = {
            'status': 1,
            'errors': [],
            'workspaces': []
            }

        workspaces = DBSession.query(Workspace.id, Workspace.name) \
            .order_by(Workspace.name).all()

        for workspace in workspaces:
            response['workspaces'].append({
                'id': workspace[0],
                'name': workspace[1]
                })

        return response


    @view_config(
        route_name='workspace.maps',
        permission='view',
        renderer='json',
        request_method='POST'
    )
    def maps(self):
        response = {
            'status': 0,
            'errors': [],
            'maps': []
            }

        try:
            name = self.request.POST.get('name')
        except KeyError as e:
            response['errors'].append('A name is required.')

        try:
            password = self.request.POST.get('password')
        except KeyError as e:
            password = None

        try:
            type = self.request.POST.get('type')
        except KeyError as e:
            type = None

        if len(response['errors']) == 0:
            if name != 'default' and name != self.request.userid:
                workspace = Workspace().authenticate(name, password)

                if not workspace:
                    response['errors'].append('Wrong credentials.')
            else:
                workspace = Workspace.by_name(name)

            if workspace:
                maps = workspace.get_maps(type)
                for map in maps:
                    mapserver_url = self.request.registry.settings.get('mapserver.url', '')
                    mapfile_directory = self.request.registry.settings.get('workspaces.directory', '') + '/' 
                    mapfile_directory += workspace.name + '/' + map.name + '/map/' + map.name + '.map'

                    (url, thumbnail_url) = MapManager.get_urls(
                        name=map.name,
                        extent=map.extent,
                        projection=map.projection,
                        mapfile_directory=mapfile_directory,
                        mapserver_url=mapserver_url
                        )

                    obj_map = dict(map)
                    obj_map['url'] = url
                    obj_map['thumbnail_url'] = thumbnail_url

                    response['maps'].append(obj_map)

                response['status'] = 1

        return response