import logging
import codecs
import transaction
from BeautifulSoup import BeautifulStoneSoup

from pyramid.httpexceptions import (
    HTTPFound,
    HTTPNotFound
)
from pyramid.view import view_config
from pyramid.response import FileResponse

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
            'layers': [],
            'layernames': []
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
            paths = []
            
            ## Add the default folder
            workspacesDirectory = self.request.registry.settings.get('workspaces.directory', '') + '/'
            mapDirectory = workspacesDirectory + self.request.userid + '/' + map.name + '/'

            mapcacheDirectory = self.request.registry.settings.get('mapcache.output.directory', '')
            if not mapcacheDirectory or mapcacheDirectory == '':
                mapcacheDirectory = mapDirectory+'mapcache/'
            else:
                mapcacheDirectory = mapcacheDirectory.rstrip('/') + '/'

            paths.append(mapcacheDirectory)
            level = 3 #maximum depth for recursive search
            for path in paths:
                some_dir = path.rstrip(os.path.sep)
                assert os.path.isdir(some_dir)
                num_sep = some_dir.count(os.path.sep)
                for root, dirs, filenames in os.walk(some_dir):
                    num_sep_this = root.count(os.path.sep)
                    if num_sep + level <= num_sep_this:
                        del dirs[:]
                    for filename in fnmatch.filter(filenames, 'mapcacheConfig.xml'):
                        response['layernames'].append(os.path.split(root)[1])
                        response['layers'].append(os.path.join(root, filename))
                        pprint.pprint(os.path.join(root, filename))
                        break
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
        response = {
            'status': 0,
            'errors': [],
        }
        # Validation
        try:
            mapID = self.request.GET.get('map')
        except KeyError as e:
            response['errors'].append('A map ID is required.')
        if mapID is None:
            response['errors'].append('A map ID is required.')
        try:
            jobPath = self.request.GET.get('job')
        except KeyError as e:
            response['errors'].append('A job path is required.')
        if jobPath is None:
            response['errors'].append('A job path is required.')
        try:
            tilerequest = self.request.GET.get('request')
        except KeyError as e:
            response['errors'].append('A tile request is required.')
        if tilerequest is None:
            response['errors'].append('A tile request is required.')
        try:
            map = Map.by_id(mapID)
        except NoResultFound, e:
            response['errors'].append('This map is unavailable or does not exist.')
            return response
        workspace = Workspace.by_id(map.workspace_id)
        if len(response['errors']) is 0: 
            if workspace.name == self.request.userid:
                if(os.path.isfile(jobPath)):
                    # We now get the tileset and the grid from the config file
                    # NOTE: We only support 1 tileset per config file for now, but several grids are supported.
                    try:
                        with codecs.open(jobPath, encoding='utf8') as f:
                            content = f.read()
                            f.close()
                    except IOError:
                       response['errors'].append("An error occured while opening '" + config_file + "' file.")
                       return response
                    content = BeautifulStoneSoup(content)
                    tileset = content.mapcache.find('tileset')
                    #Finding out the name of the tileset
                    tilesetname = tileset['name']
                    #Getting the tileset's grid
                    grid = tileset.find("grid").getText()
                    #getting the cache's path
                    cacheName = tileset.find("cache").getText()
                    cache = content.find("cache", {"name":cacheName})
                    cachePath = cache.find("base").getText()
                    
                    tilesPath = os.path.join(cachePath,tilesetname) 
                    tilesPath = os.path.join(tilesPath,grid) 
                    if(os.path.isdir(tilesPath)):
                        requestArgs = tilerequest.split("/")
                        z = requestArgs[2].zfill(2)
                        x = requestArgs[3].zfill(9)
                        y = requestArgs[4]
                        y = y.replace(".png","")
                        y = y.zfill(9)
                        imagepath = os.path.join(tilesPath, z, x[:3], x[3:6], x[6:9], y[:3], y[3:6],y[6:9]+".png")
                        if os.path.isfile(imagepath):
                            return FileResponse(
                                imagepath,
                                content_type="image/png"
                            )
            else:
               response['errors'].append('Access denied.')
        return response
