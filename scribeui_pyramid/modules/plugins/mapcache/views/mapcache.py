# Job status
#    0 - Finished 
#    1 - In progress
#    2 - Stopped (error)

import logging

from scribeui_pyramid.modules.maps.models import Map
from scribeui_pyramid.modules.workspaces.models import Workspace
import transaction
import codecs
from BeautifulSoup import BeautifulSoup
from pyramid.view import view_config
from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy import exc


log = logging.getLogger(__name__)

#import simplejson, pprint, sys, os
import os

from ..processManager import processManager

from .. import DBSession

from ..models import (
    Job,
    DatabaseConfig
)

#sys.path.append("../../") # Gives access to init.py functions

#plugin = Blueprint('mapcache', __name__, static_folder='static', template_folder='templates')

#def getJsFiles():
#    createTable()
#    return url_for('mapcache.static',filename='js/mapcache.js')

#def getCssFiles():
#    return url_for('mapcache.static',filename='css/mapcache.css')

class APIMapcache(object):

    def __init__(self, request):
        self.request = request
        self.matchdict = request.matchdict

        
    @view_config(
        route_name='mapcache.startjob',
        permission='view',
        renderer='json',
        request_method='POST'
    )
    def startJob(self):
        response = {
            'status': 0,
            'errors': [],
            'job': {}
            }

        extent = None
        dbconfig = None
        
        try:
            mapID = self.request.POST.get('map')
            if mapID == '':
                response['errors'].append('An map ID is required.')
        except KeyError as e:
            response['errors'].append('A map ID is required.')

        try:
            title = self.request.POST.get('title')
            if title == '':
                response['errors'].append('A job title is required.')
        except KeyError as e:
            response['errors'].append('A job title is required.')

        try:
            zoomLevels = self.request.POST.get('zoomlevels')
            if zoomLevels == '':
                response['errors'].append('Zoom levels are required.')
        except KeyError as e:
            response['errors'].append('Zoom levels are required.')

        try:
            metatile = self.request.POST.get('metatile')
            if metatile == '':
                response['errors'].append('Metatiles size is required.')
        except KeyError as e:
            response['errors'].append('Metatiles size is required.')

        try:
            grid = self.request.POST.get('grid')
            if grid == '':
                response['errors'].append('A grid is required.')
        except KeyError as e:
            response['errors'].append('A grid is required.')

        try:
            extent_type = self.request.POST.get('type')
            if extent_type == '':
                response['errors'].append('Extent type is required.')
        except KeyError as e:
            response['errors'].append('Extent type is required.')

        if len(response['errors']) == 0:
            if extent_type == 'string':
                try:
                    extent = self.request.POST.get('extent')
                    if extent == '':
                        response['errors'].append('An extent is required.')
                except KeyError as e:
                    response['errors'].append('An extent is required.')
            else:
                try:
                    dbhost = self.request.POST.get('dbhost')
                    if dbhost == '':
                        response['errors'].append('Host name is required.')
                except KeyError as e:
                    response['errors'].append('Host name is required.')

                try:
                    dbport = self.request.POST.get('dbport')
                    if dbport == '':
                        response['errors'].append('Database port is required.')
                except KeyError as e:
                    response['errors'].append('Database port is required.')

                try:
                    dbname = self.request.POST.get('dbname')
                    if dbname == '':
                        response['errors'].append('Database name is required.')
                except KeyError as e:
                    response['errors'].append('Database name is required.')

                try:
                    dbuser = self.request.POST.get('dbuser')
                    if dbuser == '':
                        response['errors'].append('Database user is required.')
                except KeyError as e:
                    response['errors'].append('Database user is required.')

                try:
                    dbpassword = self.request.POST.get('dbpassword')
                    if dbpassword == '':
                        dbpassword = None
                except KeyError as e:
                    dbpassword = None

                try:
                    dbquery = self.request.POST.get('dbquery')
                    if dbquery == '':
                        response['errors'].append('A query is required.')
                except KeyError as e:
                    response['errors'].append('A query is required.')

                if len(response['errors']) == 0:
                    dbconfig = {
                        'type': extent_type,
                        'host': dbhost,
                        'port': dbport,
                        'name': dbname,
                        'user': dbuser,
                        'password': dbpassword,
                        'query': dbquery    
                    }
                

            if len(response['errors']) == 0:               
                try:
                    map = Map.by_id(mapID)
                except NoResultFound, e:
                    response['errors'].append('This map is unavailable or does not exist.')

                if len(response['errors']) == 0:
                    workspace = Workspace.by_id(map.workspace_id)
                    if(workspace.name == self.request.userid):
                        workspaces_directory = self.request.registry.settings.get('workspaces.directory', '') + '/'
                        map_directory = workspaces_directory + self.request.userid + '/' + map.name + '/'
                        mapfile = map_directory + 'map/' + map.name + '.map' 

                        kwargs = {
                            'title': title,
                            'status': 1,
                            'map_id': mapID
                        }

                        job = Job(**kwargs)

                        try:
                            DBSession.add(job)
                            #used to get the job id
                            DBSession.flush()
                        except exc.SQLAlchemyError as e:
                            response['errors'].append(e)

                           
                        if len(response['errors']) == 0:
                            job_directory = self.request.registry.settings.get('mapcache.output.directory', '')
                            mapserver_url = self.request.registry.settings.get('mapserver.url', '') + '?'

                            pManager = processManager()
                            pManager.addProcess(job, map_directory, mapfile, zoomLevels, metatile, grid, 
                                extent=extent, dbconfig=dbconfig, jobdir=job_directory, mapserver_url=mapserver_url)

                            kwargs['id'] = job.id
                            response['job'] = kwargs
                            response['status'] = 1
                    else:
                        response['errors'].append('Access denied.')
             
        return response
    @view_config(
        route_name='mapcache.getjobs',
        permission='view',
        renderer='json',
        request_method='GET'
    )
    def getJobs(self):
        response = {
            'status': 0,
            'errors': [],
            'jobs': []
            }

        try:
            ws_name= self.request.GET.get('ws')
            if ws_name == '':
                response['errors'].append('A workspace name is required.')
        except KeyError as e:
            response['errors'].append('A workspace name is required.')

        if len(response['errors']) == 0:
            workspace = Workspace.by_name(ws_name)
            if(workspace.name == self.request.userid):
                query = DBSession.query(
                    Job.id,
                    Job.title, 
                    Job.status, 
                    Job.map_id,
                    Map.workspace_id,
                    Map.id,
                    Map.name) \
                    .filter(Map.workspace_id == workspace.id, Job.map_id == Map.id)

                jobs = query.all()            

                for job in jobs:
                    response['jobs'].append({
                        'id': job[0],
                        'title': job[1],
                        'status': job[2],
                        'map_name': job[6]
                        })

                response['status'] = 1
            else:
                response['errors'].append('Access denied.')

        return response

    @view_config(
        route_name='mapcache.stopjob',
        permission='view',
        renderer='json',
        request_method='GET'
    )
    def stopJob(self):
        response = {
            'status': 0,
            'errors': [],
            'log': ''
            }
        #TODO : prevent clearing job from another workspace than the current one
        try:
            id = self.request.GET.get('job')
            if id == '':
                response['errors'].append('A job id is required.')
        except KeyError as e:
            response['errors'].append('A job id is required.')

        if len(response['errors']) == 0:
            try:
                job = Job.by_id(id)
            except NoResultFound, e:
                response['errors'].append('Job not found. Was it cleared already?')

            if len(response['errors']) == 0:
                if job.status == 1:
                    pManager = processManager()
                    pManager.stopProcess(job.id, False)
                    try:
                        job.status = 2
                        transaction.commit()
                    except exc.SQLAlchemyError as e:
                        response['errors'].append("An error occured while updating job status.")
                else:
                    response['errors'].append("Job was already finished or stopped.")

                if len(response['errors']) == 0:
                    response['status'] = 1
                    response['log'] = 'Job ' + str(id) + ' has been stopped.'

        return response


    @view_config(
        route_name='mapcache.clearjob',
        permission='view',
        renderer='json',
        request_method='GET'
    )
    def clearJob(self):
        response = {
            'status': 0,
            'errors': [],
            'log': ''
            }
        #TODO : prevent clearing job from another workspace than the current one
        try:
            id = self.request.GET.get('job')
        except KeyError as e:
            response['errors'].append('A job id is required.')

        if len(response['errors']) == 0:
            try:
                job = Job.by_id(id)
            except NoResultFound, e:
                response['errors'].append('Job not found. Was it cleared already?')

            if len(response['errors']) == 0:
                if job.status == 1: #Cancel clear if job is still in progress 
                    response['errors'].append('Job is in progress, please stop before clearing')
                else:    
                    try:
                        DBSession.delete(job)
                    except exc.SQLAlchemyError as e:
                        response['errors'].append("An error occured whileclearing the job.")
                
                if len(response['errors']) == 0:
                    response['status'] = 1
                    response['log'] = 'Job ' + str(id) + ' has been cleared.'
        
        return response


    @view_config(
        route_name='mapcache.database.config.save',
        permission='view',
        renderer='json',
        request_method='POST'
    )
    def save_config(self):
        response = {
            'status': 0,
            'errors': []
            }

        try:
            ws_name = self.request.POST.get('ws')
            if ws_name == '':
                response['errors'].append('A workspace name is required.')
        except KeyError as e:
            response['errors'].append('A workspace name is required.')

        try:
            name = self.request.POST.get('name')
            if name == '':
                response['errors'].append('Config name is required.')
        except KeyError as e:
            response['errors'].append('Config name is required.')

        try:
            dbtype = self.request.POST.get('dbtype')
            if dbtype == '':
                response['errors'].append('Database type is required.')
        except KeyError as e:
            response['errors'].append('Database type is required.')

        try:
            dbhost = self.request.POST.get('dbhost')
            if dbhost == '':
                response['errors'].append('Host name is required.')
        except KeyError as e:
            response['errors'].append('Host name is required.')

        try:
            dbport = self.request.POST.get('dbport')
            if dbport == '':
                response['errors'].append('Database port is required.')
        except KeyError as e:
            response['errors'].append('Database port is required.')

        try:
            dbname = self.request.POST.get('dbname')
            if dbname == '':
                response['errors'].append('Database name is required.')
        except KeyError as e:
            response['errors'].append('Database name is required.')

        try:
            dbuser = self.request.POST.get('dbuser')
            if dbuser == '':
                response['errors'].append('Database user is required.')
        except KeyError as e:
            response['errors'].append('Database user is required.')

        try:
            dbquery = self.request.POST.get('dbquery')
            if dbquery == '':
                dbquery = None
        except KeyError as e:
            dbquery = None

        if len(response['errors']) == 0:
            workspace = Workspace.by_name(ws_name)
            if(workspace.name == self.request.userid):
                dbconfig_query = DBSession.query(DatabaseConfig).filter(
                    DatabaseConfig.name == name, 
                    DatabaseConfig.workspace_id == workspace.id
                )

                try:
                    dbconfig = dbconfig_query.one()
                except NoResultFound, e:
                    dbconfig = None

                kwargs = {
                    'name': name,
                    'type': dbtype,
                    'host': dbhost,
                    'port': dbport,
                    'database_name': dbname,
                    'user': dbuser,
                    'query': dbquery,
                    'workspace_id': workspace.id    
                }

                if dbconfig:
                    try:
                        dbconfig_query.update(kwargs)
                    except exc.SQLAlchemyError as e:
                        response['errors'].append("An error occured while updating database config.")  
                else:
                    dbconfig = DatabaseConfig(**kwargs)

                    try:
                        DBSession.add(dbconfig)
                    except exc.SQLAlchemyError as e:
                        response['errors'].append(e)

                if len(response['errors']) == 0:
                    response['status'] = 1
            else:
                response['errors'].append('Access denied.')

        return response


    @view_config(
        route_name='mapcache.database.config.delete',
        permission='view',
        renderer='json',
        request_method='POST'
    )
    def delete_config(self):
        response = {
            'status': 0,
            'errors': []
            }

        try:
            ws_name = self.request.POST.get('ws')
            if ws_name == '':
                response['errors'].append('A workspace name is required.')
        except KeyError as e:
            response['errors'].append('A workspace name is required.')

        try:
            name = self.request.POST.get('name')
            if name == '':
                response['errors'].append('Config name is required.')
        except KeyError as e:
            response['errors'].append('Config name is required.')

        if len(response['errors']) == 0:
            workspace = Workspace.by_name(ws_name)
            if(workspace.name == self.request.userid):
                dbconfig_query = DBSession.query(
                    DatabaseConfig
                    ).filter(
                    DatabaseConfig.name == name, 
                    DatabaseConfig.workspace_id == workspace.id
                )

                try:
                    dbconfig = dbconfig_query.one()
                except NoResultFound, e:
                    response['errors'].append("The database configuration you're trying to delete was not found.")

                if len(response['errors']) == 0:
                    try:
                        dbconfig_query.delete()
                    except exc.SQLAlchemyError as e:
                        response['errors'].append("An error occured while deleting database config.")

                    if len(response['errors']) == 0:
                        response['status'] = 1
            else:
                response['errors'].append('Access denied.')

        return response


    @view_config(
        route_name='workspaces.mapcache.database.config.get',
        permission='view',
        renderer='json',
        request_method='GET'
    )
    def get_workspace_configs(self):
        response = {
            'status': 0,
            'errors': [],
            'configs': []
            }

        try:
            ws_name = self.request.GET.get('ws')
        except KeyError as e:
            response['errors'].append('A workspace name is required.')

        if len(response['errors']) == 0:
            workspace = Workspace.by_name(ws_name)
            if(workspace.name == self.request.userid):
                dbconfig_query = DBSession.query(
                    DatabaseConfig.name,
                    DatabaseConfig.type,
                    DatabaseConfig.host,
                    DatabaseConfig.port,
                    DatabaseConfig.database_name,
                    DatabaseConfig.user,
                    DatabaseConfig.query
                    ).filter(
                    DatabaseConfig.workspace_id == workspace.id
                )
                
                try:
                    dbconfigs = dbconfig_query.all()
                except NoResultFound, e:
                    response['errors'].append("The database configuration you requested was not found.")

                if len(response['errors']) == 0:
                    for dbconfig in dbconfigs:
                        response['configs'].append({
                            'name': dbconfig[0],
                            'dbtype': dbconfig[1],
                            'dbhost': dbconfig[2],
                            'dbport': dbconfig[3],
                            'dbname': dbconfig[4],
                            'dbuser': dbconfig[5],
                            'dbquery': dbconfig[6]
                        })

                    response['status'] = 1
            else:
                response['errors'].append('Access denied.')

        return response


    @view_config(
        route_name='mapcache.grids.get',
        permission='view',
        renderer='json',
        request_method='GET'
    )
    def get_grids(self):
        response = {
            'status': 0,
            'errors': [],
            'grids': []
            }

        try:
            map_id = self.request.GET.get('map')
            if map_id == '':
                response['errors'].append('A map id is required.')
        except KeyError as e:
            response['errors'].append('A map id is required.')

        if len(response['errors']) == 0:
            map = Map.by_id(map_id)
            workspace = Workspace.by_id(map.workspace_id)

            if(workspace.name == self.request.userid):
                current_directory = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
                config_file = current_directory + 'mapcacheConfig.xml.default'
                codecs.open(config_file, encoding='utf8', mode='r')

                try:
                    with codecs.open(config_file, encoding='utf8') as f:
                        config = f.read()
                        f.close()
                except IOError:
                    response['errors'].append("An error occured while opening '" + config_file + "' file.")

                if len(response['errors']) == 0:
                    try:
                        config_bs = BeautifulSoup(config)
                        grids = config_bs.mapcache.findAll('grid')
                    except:
                        response['errors'].append("An error occured while parsing '" + config_file + "' file.")
                            
                    if len(response['errors']) == 0:
                        for grid in grids:
                            for attr, val in grid.attrs:
                                if attr == 'name':
                                    response['grids'].append(val)

                        response['status'] = 1
            else:
                response['errors'].append('Access denied.')

        return response  
