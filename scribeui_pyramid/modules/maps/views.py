# -*- coding: utf-8 -*-
import codecs
import datetime
import glob
import json
import logging
import os
import re
import shutil
import subprocess
import transaction
import zipfile
from sqlalchemy import exc
from pyramid.view import view_config
from pyramid.response import FileResponse
from tempfile import NamedTemporaryFile
from ..app.sqla import DBSession
from ..workspaces.models import Workspace
from .models import Map
from . import MapManager
from .scribe import (
    string2json,
    list2dict
    )


log = logging.getLogger(__name__)


class APIMap(object):

    def __init__(self, request):
        self.request = request
        self.matchdict = request.matchdict

    @view_config(
        route_name='maps.new',
        permission='view',
        renderer='json',
        request_method='POST'
    )
    def new_map(self):
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
            type = self.request.POST.get('type')
        except KeyError as e:
            response['errors'].append('A type is required.')

        try:
            template = self.request.POST.get('template')
        except KeyError as e:
            response['errors'].append('A template is required.')

        try:
            template_workspace = self.request.POST.get('template_workspace')
        except KeyError as e:
            template_workspace = 'default'

        try:
            template_workspace_password = self.request.POST.get('template_workspace_password')
        except KeyError as e:
            template_workspace_password = None

        try:
            description = self.request.POST.get('description')
        except KeyError as e:
            description = None

        if len(response['errors']) == 0:

            # different workspace than the default one or the current workspace
            if template_workspace != 'default' and template_workspace != self.request.userid:
                workspace = Workspace().authenticate(template_workspace, template_workspace_password)

                if not workspace:
                    response['errors'].append('Wrong credentials.')
            else:
                workspace = Workspace.by_name(template_workspace)
                
            if len(response['errors']) == 0:
                current_workspace = Workspace.by_name(self.request.userid)

                if not MapManager.is_valid_name(name):
                    response['errors'].append('Name is not valid.')

                if current_workspace.get_map_by_name(name):
                    response['errors'].append('A map with that name already exists.')

                if len(response['errors']) == 0:
                    workspaces_directory = self.request.registry.settings.get('workspaces.directory', '') + '/'
                    template_directory = workspaces_directory + template_workspace + '/' + template + '/'
                    map_directory = workspaces_directory + self.request.userid + '/' + name + '/'
                    mapfile_directory = map_directory + 'map/'
                    mapfile = mapfile_directory + name + '.map' 

                    try:
                        subprocess.call(['cp','-r', template_directory, map_directory]) 
                    except subprocess.CalledProcessError as e:
                        response['errors'].append(e.output)

                    try:
                        subprocess.call(['mv', mapfile_directory + template + '.map', mapfile]) 
                    except subprocess.CalledProcessError as e:
                        response['errors'].append(e.output)
                                              

                    if len(response['errors']) == 0:
                        workspace_id = current_workspace.id

                        (projection, extent) = MapManager.get_proj_extent_from_mapfile(mapfile)

                        kwargs = {
                            'name': name,
                            'type': type,
                            'description': description,
                            'projection': projection,
                            'extent': extent,
                            'workspace_id': workspace_id
                        }

                        map = Map(**kwargs)

                        try:
                            DBSession.add(map)
                            response['status'] = 1
                        except exc.SQLAlchemyError as e:
                            response['errors'].append(e)
                            
        return response


    @view_config(
        route_name='maps.open',
        permission='view',
        renderer='json',
        request_method='POST'
    )
    def open_map(self):
        response = {
            'status': 0,
            'errors': []
            }

        map = Map.by_id(self.matchdict.get('id'))
        workspace = Workspace.by_id(map.workspace_id)

        if(workspace.name == self.request.userid):
            mapserver_url = self.request.registry.settings.get('mapserver.url', '')
            workspace_directory = self.request.registry.settings.get('workspaces.directory', '') + '/' + workspace.name + '/'
            map_directory = workspace_directory + map.name + '/'
            mapfile_directory = map_directory + 'map/' + map.name + '.map'

            (url, thumbnail_url) = MapManager.get_urls(
                name=map.name,
                extent=map.extent,
                projection=map.projection,
                mapfile_directory=mapfile_directory,
                mapserver_url=mapserver_url
                )
            
            data = dict(map)
            data['url'] = url
            data['thumbnail_url'] = thumbnail_url
            data['variables'] = None

            if map.type == 'Scribe':
                groups_directory = map_directory + 'editor/'
                filenames = MapManager.get_scribe_files()
            else:
                groups_directory = map_directory + 'map/layers/'
                filenames = MapManager.get_standard_files(map.name)

            for filename in filenames.keys():
                try:
                    with codecs.open(map_directory + filenames[filename], encoding='utf8') as f:
                        data[filename] = f.read()
                        f.close()
                except IOError:
                    data[filename] = None

            try:
                with codecs.open(map_directory + 'config', encoding='utf8') as f:
                    groups_config = f.read()
                    f.close()
            except IOError:
                response['errors'].append("Groups config file not found.")

            if len(response['errors']) == 0:
                groups_config_obj = json.loads(string2json(groups_config))

                data['groups'] = [''] * (len(groups_config_obj['ORDER']))

                for g in groups_config_obj['ORDER']:
                    for index in g.keys():
                        group_file = groups_directory + g[index]
                        try:
                            with codecs.open(group_file, encoding='utf8') as f:
                                group_data = f.read()
                                f.close()
                        except IOError:
                            response['errors'].append("File " + group_file + " not found.")

                        if len(response['errors']) == 0:
                            group_name = g[index].replace('.layer', '').replace('.map', '').split('/')[-1]
                            data['groups'][int(index) - 1] = {
                                'name': group_name,
                                'content': group_data
                            }

                if len(response['errors']) == 0:
                    data['OLExtent'] = map.extent.replace(',', ' ') if map.extent else None
                    data['OLProjection'] = map.projection
                    data['OLUnits'] = None
                    data['OLScales'] = None

                    try:
                        with codecs.open(mapfile_directory, encoding='utf8') as f:
                            mapfile_lines = f.readlines()
                            f.close()
                    except IOError:
                        response['errors'].append("File " + mapfile_directory + " not found.")

                    if len(response['errors']) == 0:
                        for line in mapfile_lines:
                            line = line.strip()
                            index = line.find('UNITS')
                            if index != -1:
                                data['OLUnits'] = line[index+6:].replace(':', '').strip()

                        try:
                            scales = json.loads(string2json(data['scales']))
                            data['OLScales'] = list2dict(scales['SCALES']) 
                        except:
                            response['errors'].append('Could not determine scale levels.')

            if len(response['errors']) == 0:
                data['pois'] = []
                lines = None

                try:
                    with codecs.open(map_directory + 'poi', encoding='utf8') as f:
                        lines = f.readlines()
                        f.close()
                except IOError:
                    pass

                if lines:
                    for line in lines:
                        poi = line.split(',')
                        if len(poi) >= 3 and len(poi) <= 5:
                            data['pois'].append({
                                'name': poi[0],
                                'lon': float(poi[1]),
                                'lat': float(poi[2]),
                                'scale': float(poi[3]) if len(poi) >= 4 else None,
                                'projection': poi[4] if len(poi) == 5 else None  
                                })
                        #else:
                        #    response['errors'].append("Invalid poi file.")

            if len(response['errors']) == 0:
                connector_directory = self.request.registry.settings.get('cgi.directory', '') + '/elfinder-python/'
                connector_file = connector_directory + 'connector-' + workspace.name + '-' + map.name + '.py'
                source_file = connector_directory + 'connector.py' 

                if not os.path.isfile(connector_file):
                    try:
                        with codecs.open(source_file, encoding='utf8') as f:
                            source_content = f.read()
                            f.close()
                    except IOError:
                        response['errors'].append("File " + source_file + " not found.")

                    try:
                        with codecs.open(connector_file, encoding='utf8', mode='w+') as f:
                            f.write(source_content.replace('MAPURL', map_directory))
                            f.close()
                    except IOError:
                        response['errors'].append("File " + source_file + " not found.")

                    try:
                        subprocess.call(['chmod','+x', connector_file])
                        response['status'] = 1 
                    except subprocess.CalledProcessError as e:
                        response['errors'].append(e.output)
                else:
                    response['status'] = 1

        else:
            response['errors'].append('Access denied.')

        response['data'] = data

        return response


    @view_config(
        route_name='maps.delete',
        permission='view',
        renderer='json',
        request_method='POST'
    )
    def delete_map(self):
        response = {
            'status': 0,
            'errors': []
            }

        map = Map.by_id(self.matchdict.get('id'))
        workspace = Workspace.by_id(map.workspace_id)

        if(workspace.name == self.request.userid):
            workspace_directory = self.request.registry.settings.get('workspaces.directory', '') + '/' + workspace.name + '/'
            map_directory = workspace_directory + map.name + '/'
            connector_file = self.request.registry.settings.get('cgi.directory', '') + \
                            '/elfinder-python/connector-' + workspace.name + '-' + map.name + '.py'

            try:
                subprocess.call(['rm','-r', map_directory]) 
            except subprocess.CalledProcessError as e:
                response['errors'].append(e.output)

            if len(response['errors']) == 0:
                try:
                    subprocess.call(['rm', connector_file]) 
                except subprocess.CalledProcessError as e:
                    response['errors'].append(e.output)

                if len(response['errors']) == 0:
                    try:
                        DBSession.delete(map)
                        response['status'] = 1
                    except exc.SQLAlchemyError as e:
                        response['errors'].append(e)

        else:
            response['errors'].append('Access denied.')

        return response


    @view_config(
        route_name='maps.groups.update',
        permission='view',
        renderer='json',
        request_method='POST'
    )
    def update_groups(self):
        response = {
            'status': 0,
            'errors': []
            }

        map = Map.by_id(self.matchdict.get('id'))
        workspace = Workspace.by_id(map.workspace_id)

        if(workspace.name == self.request.userid):
            try:
                groups = self.request.POST.get('groups')
                if groups and groups != '':
                    groups = groups.split(',')
            except KeyError as e:
                pass

            try:
                new_groups = self.request.POST.get('new_groups')
                new_groups = new_groups.split(',')
            except KeyError as e:
                pass

            try:
                removed_groups = self.request.POST.get('removed_groups')
                removed_groups = removed_groups.split(',')
            except KeyError as e:
                pass

            if isinstance(groups, list) and len(groups) > 0:
                for group in groups:
                    if not MapManager.is_valid_name(group):
                        response['errors'].append('Name is not valid.')

            if len(response['errors']) == 0:    
                workspace_directory = self.request.registry.settings.get('workspaces.directory', '') + '/' + workspace.name + '/'
                map_directory = workspace_directory + map.name + '/'

                if map.type == 'Scribe':
                    groups_directory = map_directory + 'editor/groups/'
                    prefix = 'groups/'
                    suffix = '.layer'
                else:
                    groups_directory = map_directory + 'map/layers/'
                    prefix = ''
                    suffix = '.map'

                if len(response['errors']) == 0:
                    groups_config = "ORDER {\n"
                    for index, group in enumerate(groups):
                        group_path = prefix + group + suffix
                        groups_config += ' ' + str(index + 1) + ': ' + group_path + '\n'
                    groups_config += "}"

                    try:
                        with codecs.open(map_directory + 'config', encoding='utf8', mode='w+') as f:
                            f.write(groups_config)
                            f.close()
                    except IOError as e:
                        response['errors'].append("Groups config file not found.")

                    if len(response['errors']) == 0:
                        for group in removed_groups:
                            try:
                                subprocess.call(['rm', groups_directory + group + suffix])
                            except IOError:
                                response['errors'].append("An error occured while removing a group file.")

                        for group in new_groups:
                            try:
                                file(groups_directory + group + suffix, 'w+')
                            except IOError:
                                response['errors'].append("An error occured while creating a new group file.")

                        if len(response['errors']) == 0:
                            response['status'] = 1
        else:
            response['errors'].append('Access denied.')

        return response


    @view_config(
        route_name='maps.save',
        permission='view',
        renderer='json',
        request_method='POST'
    )
    def save_map(self):
        response = {
            'status': 0,
            'errors': [],
            'logs': '',
            'mapfile': '',
            'debug': ''
            }

        map = Map.by_id(self.matchdict.get('id'))
        workspace = Workspace.by_id(map.workspace_id)

        if(workspace.name == self.request.userid):
            try:
                data = self.request.json_body
            except ValueError as e:
                response['errors'].append('Missing data.')

            if len(response['errors']) == 0:
                workspace_directory = self.request.registry.settings.get('workspaces.directory', '') + '/' + workspace.name + '/'
                map_directory = workspace_directory + map.name + '/'
                mapfile_directory = map_directory + 'map/'
                mapfile = mapfile_directory + map.name + '.map' 

                if map.type == 'Scribe':
                    groups_directory = map_directory + "editor/groups/"
                    filenames = MapManager.get_scribe_files()

                    layers = "LAYERS {\n"

                    for group in data['groups']:
                        try:
                            with codecs.open(groups_directory + group['name'] + '.layer', encoding='utf8', mode='w+') as f:
                                f.write(group['content'].encode('utf-8', errors='replace'))
                                f.close()
                        except IOError:
                            response['errors'].append("An error occured while saving '" + map_directory + group['name'] + ".layer' file.")

                        layers += group['content'] + '\n'

                    layers += "}"

                    try:
                        with codecs.open(map_directory + 'editor/layers', encoding='utf8', mode='w+') as f:
                            f.write(layers.encode('utf-8', errors='replace'))
                            f.close()
                    except IOError:
                        response['errors'].append("An error occured while saving '" + map_directory + "editor/layers' file.")
                else:
                    groups_directory = map_directory + 'map/layers/'
                    filenames = MapManager.get_standard_files(map.name)

                    for group in data['groups']:
                        try:
                            with codecs.open(groups_directory + group['name'] + '.map', encoding='utf8', mode='w+') as f:
                                f.write(group['content'].encode('utf-8', errors='replace'))
                                f.close()
                        except IOError:
                            response['errors'].append("An error occured while saving '" + map_directory + group['name'] + ".map' file.")

                for filename in filenames.keys():
                    try:
                        with codecs.open(map_directory + filenames[filename], encoding='utf8', mode='w+') as f:
                            ##f.write(data[filename].encode('utf-8'))
                            f.write(data[filename])
                            f.close()
                    except IOError:
                        response['errors'].append("An error occured while saving '" + map_directory + filenames[filename] + "' file.")

                if len(response['errors']) == 0:
                    debug_level = '1'
                    if map.type == 'Scribe':
                        scribe = self.request.registry.settings.get('scribe.python', '')
                        sub = subprocess.Popen('/usr/bin/python2.7 ' + scribe + ' -n ' + map.name + ' -i ' + map_directory + 'editor/ -o ' + map_directory + 'map/ -f ' + map_directory + 'config -d ' + debug_level, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE) 
                        logs = sub.stdout.read()
                        errors = sub.stderr.read()

                        if errors == '':
                            response['logs'] = '**Success**'
                            response['debug'] = logs
                        else:
                            response['logs'] = '**Errors**\n----------\n' + errors + '\n**Logs**\n----------\n' + logs
                            response['errors'].append('An error occured while running scribe.py')
                    else:
                        outputDirectory = map_directory + 'map/';
                        sub = subprocess.Popen('shp2img -m ' + outputDirectory + map.name + '.map -all_debug ' + debug_level + ' -o ' + outputDirectory + 'debug.png', shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE) 
                        logs = 'Mapserver logs (debug level ' + debug_level + ')\n'
                        logs += '------------------------------\n'
                        logs += sub.stderr.read().strip() + sub.stdout.read().strip()
                        response['debug'] = logs
                        response['logs'] = '**Success**'

                    (projection, extent) = MapManager.get_proj_extent_from_mapfile(mapfile)

                    map.projection = projection
                    map.extent = extent
                    transaction.commit()
                    
                    if len(response['errors']) == 0:
                        response['status'] = 1
                        
                try:
                    with codecs.open(mapfile, encoding='utf8') as f:
                        mapfile_content = f.read()
                        response['mapfile'] = mapfile_content
                        f.close()
                except IOError:
                    response['errors'].append("An error occured while opening '" + mapfile + "' file.")
        else:
            response['errors'].append('Access denied.')

        return response


    @view_config(
        route_name='maps.configure',
        permission='view',
        renderer='json',
        request_method='POST'
    )
    def configure_map(self):
        response = {
            'status': 0,
            'errors': [],
            'logs': ''
            }

        map = Map.by_id(self.matchdict.get('id'))
        workspace = Workspace.by_id(map.workspace_id)

        if(workspace.name == self.request.userid):
            try:
                git_url = self.request.POST.get('git_url')
            except KeyError as e:
                git_url = None

            try:
                description = self.request.POST.get('description')
            except KeyError as e:
                description = None
                pass

            workspaces_directory = self.request.registry.settings.get('workspaces.directory', '') + '/'
            map_directory = workspaces_directory + self.request.userid + '/' + map.name + '/'
            os.chdir(map_directory)

            hasGitConfig = os.path.isfile(map_directory + '.git/config')
            if hasGitConfig:
                try:
                    subprocess.call(['rm', '.gitignore'])
                except IOError:
                    pass

            if (git_url != map.git_url) or (git_url is not None and git_url == map.git_url and not hasGitConfig):   
                try:
                    MapManager.git_init(git_url)
                except Exception, e:
                    response['errors'].append(str(e))
                    response['logs'] += str(e) + '\n'

                if len(response['errors']) == 0:
                    if map.git_url and hasGitConfig:
                        response['logs'] += 'Another git config file was detected and has been overwritten.\n' 
                    map.git_url = git_url
                  
            if description:
                map.description = description

            transaction.commit()
            
            if len(response['errors']) == 0:
                response['status'] = 1
                response['logs'] += 'Configuration successful.\n'
        else:
            response['errors'].append('Access denied.')

        return response


    @view_config(
        route_name='maps.commit',
        permission='view',
        renderer='json',
        request_method='POST'
    )
    def commit_map(self):
        response = {
            'status': 0,
            'errors': [],
            'logs': ''
            }

        map = Map.by_id(self.matchdict.get('id'))
        workspace = Workspace.by_id(map.workspace_id)

        if(workspace.name == self.request.userid):
            try:
                message = self.request.POST.get('message')
            except KeyError as e:
                response['errors'].append('A commit message is required.')

            try:
                user = self.request.POST.get('user')
            except KeyError as e:
                response['errors'].append('A user is required.')

            if not map.git_url or map.git_url == '':
               response['errors'].append('A valid git URL is required.')

            if len(response['errors']) == 0:
                try:
                    password = self.request.POST.get('password')
                except KeyError as e:
                    password = None

                workspaces_directory = self.request.registry.settings.get('workspaces.directory', '') + '/'
                map_directory = workspaces_directory + self.request.userid + '/' + map.name + '/'
                os.chdir(map_directory)

                try:
                    MapManager.git_add_remote_url(map.git_url, user, password)
                except Exception, e:
                    response['errors'].append(str(e))

                if len(response['errors']) == 0:
                    response['logs'] += 'git add .\n'
                    response['logs'] += '---------------------------------------------------\n'
                    try:
                        response['logs'] += subprocess.check_output(['git add .'], shell=True, stderr=subprocess.STDOUT)
                    except subprocess.CalledProcessError as e:
                        response['errors'].append(e.output)
                        response['logs'] += e.output
                    
                    response['logs'] += u'git commit -m "' + message + u'"\n'
                    response['logs'] += '---------------------------------------------------\n'
                    try:
                        response['logs'] += subprocess.check_output(['git commit -m "' + message + '"'], shell=True, stderr=subprocess.STDOUT)
                    except subprocess.CalledProcessError as e:
                        if '(working directory clean)' in e.output:
                            pass
                        else:
                            response['errors'].append(e.output)
                        response['logs'] += e.output
                    
                    response['logs'] += 'git pull origin master\n'
                    response['logs'] += '---------------------------------------------------\n'
                    try:
                        response['logs'] += subprocess.check_output(['git pull origin master'], shell=True, stderr=subprocess.STDOUT)
                    except subprocess.CalledProcessError as e:
                        response['errors'].append(e.output)
                        response['logs'] += e.output

                    response['logs'] += 'git push origin master\n'
                    response['logs'] += '---------------------------------------------------\n'
                    try:
                        response['logs'] += subprocess.check_output(['git push origin master'], shell=True, stderr=subprocess.STDOUT)
                    except subprocess.CalledProcessError as e:
                        response['errors'].append(e.output)
                        response['logs'] += e.output
                    
                    if len(response['errors']) == 0:
                        response['status'] = 1

                MapManager.git_remove_remote_url()
        else:
            response['errors'].append('Access denied.')

        return response


    @view_config(
        route_name='maps.pull',
        permission='view',
        renderer='json',
        request_method='POST'
    )
    def pull_map(self):
        response = {
            'status': 0,
            'errors': [],
            'logs': ''
            }

        map = Map.by_id(self.matchdict.get('id'))
        workspace = Workspace.by_id(map.workspace_id)

        if(workspace.name == self.request.userid):
            try:
                method = self.request.POST.get('method')
            except KeyError as e:
                response['errors'].append('A pull method is required.')

            try:
                user = self.request.POST.get('user')
            except KeyError as e:
                response['errors'].append('A user is required.')

            if not map.git_url or map.git_url == '':
               response['errors'].append('A valid git URL is required.')

            if len(response['errors']) == 0:
                try:
                    password = self.request.POST.get('password')
                except KeyError as e:
                    password = None

                workspaces_directory = self.request.registry.settings.get('workspaces.directory', '') + '/'
                map_directory = workspaces_directory + self.request.userid + '/' + map.name + '/'
                mapfile_directory = map_directory + 'map/'
                mapfile = mapfile_directory + map.name + '.map'
                os.chdir(map_directory)

                try:
                    MapManager.git_add_remote_url(map.git_url, user, password)
                except Exception, e:
                    response['errors'].append(str(e))

                if len(response['errors']) == 0:
                    if method == 'merge':
                        response['logs'] += 'git pull origin master\n'
                        response['logs'] += '---------------------------------------------------\n'
                        try:
                            response['logs'] += subprocess.check_output(['git pull origin master'], shell=True, stderr=subprocess.STDOUT)
                        except subprocess.CalledProcessError as e:
                            response['errors'].append(e.output)
                            response['logs'] += e.output
                    elif method == 'overwrite':
                        response['logs'] += 'git fetch origin master\n'
                        response['logs'] += '---------------------------------------------------\n'
                        try:
                            response['logs'] += subprocess.check_output(['git fetch origin master'], shell=True, stderr=subprocess.STDOUT)
                        except subprocess.CalledProcessError as e:
                            response['errors'].append(e.output)
                            response['logs'] += e.output

                        response['logs'] += 'git reset --hard FETCH_HEAD\n'
                        response['logs'] += '---------------------------------------------------\n'
                        try:
                            response['logs'] += subprocess.check_output(['git reset --hard FETCH_HEAD'], shell=True, stderr=subprocess.STDOUT)
                        except subprocess.CalledProcessError as e:
                            response['errors'].append(e.output)
                            response['logs'] += e.output

                        response['logs'] += 'git clean -df\n'
                        response['logs'] += '---------------------------------------------------\n'
                        try:
                            response['logs'] += subprocess.check_output(['git clean -f'], shell=True, stderr=subprocess.STDOUT)
                        except subprocess.CalledProcessError as e:
                            response['errors'].append(e.output)
                            response['logs'] += e.output
                    elif method == 'stash':
                        response['logs'] += 'git stash\n'
                        response['logs'] += '---------------------------------------------------\n'
                        try:
                            response['logs'] += subprocess.check_output(['git stash'], shell=True, stderr=subprocess.STDOUT)
                        except subprocess.CalledProcessError as e:
                            response['errors'].append(e.output)
                            response['logs'] += e.output
                    
                        response['logs'] += 'git pull origin master\n'
                        response['logs'] += '---------------------------------------------------\n'
                        try:
                            response['logs'] += subprocess.check_output(['git pull origin master'], shell=True, stderr=subprocess.STDOUT)
                        except subprocess.CalledProcessError as e:
                            response['errors'].append(e.output)
                            response['logs'] += e.output

                        response['logs'] += 'git stash pop\n'
                        response['logs'] += '---------------------------------------------------\n'
                        try:
                            response['logs'] += subprocess.check_output(['git stash pop'], shell=True, stderr=subprocess.STDOUT)
                        except subprocess.CalledProcessError as e:
                            response['errors'].append(e.output)
                            response['logs'] += e.output
                    
                    if len(response['errors']) == 0:
                        try:
                            subprocess.check_output(['rm ' + mapfile_directory + 'level*.map'], shell=True, stderr=subprocess.STDOUT)
                        except subprocess.CalledProcessError as e:
                            pass

                        try:
                            subprocess.check_output(['mv ' + mapfile_directory + '*.map ' + mapfile], shell=True, stderr=subprocess.STDOUT)
                        except subprocess.CalledProcessError as e:
                            pass

                        response['status'] = 1

                MapManager.git_remove_remote_url()
        else:
            response['errors'].append('Access denied.')

        return response


    @view_config(
        route_name='maps.clone',
        permission='view',
        renderer='json',
        request_method='POST'
    )
    def clone_map(self):
        response = {
            'status': 0,
            'errors': [],
            'logs': '',
            'id': ''
            }

        try:
            name = self.request.POST.get('name')
        except KeyError as e:
            response['errors'].append('A name is required.')

        try:
            type = self.request.POST.get('type')
        except KeyError as e:
            response['errors'].append('A type is required.')

        try:
            git_url = self.request.POST.get('git_url')
        except KeyError as e:
            response['errors'].append('A git URL is required.')

        if len(response['errors']) == 0:
            if not MapManager.is_valid_name(name):
                    response['errors'].append('Name is not valid.')
                    
            if git_url == '':
               response['errors'].append('A valid git URL is required.')
                
            try:
                description = self.request.POST.get('description')
            except KeyError as e:
                description = None

            try:
                user = self.request.POST.get('user')
            except KeyError as e:
                user = None

            try:
                password = self.request.POST.get('password')
            except KeyError as e:
                password = None

        template_workspace = 'default'
        template = 'Dummy'

        if len(response['errors']) == 0:
            workspace = Workspace.by_name(template_workspace)
                
            if not MapManager.is_valid_name(name):
                response['errors'].append('Name is not valid.')

            if workspace.get_map_by_name(name):
                response['errors'].append('A map with that name already exists.')

            if len(response['errors']) == 0:
                workspaces_directory = self.request.registry.settings.get('workspaces.directory', '') + '/'
                template_directory = workspaces_directory + template_workspace + '/' + template + '/'
                map_directory = workspaces_directory + self.request.userid + '/' + name + '/'
                mapfile_directory = map_directory + 'map/'
                mapfile = mapfile_directory + name + '.map' 

                try:
                    subprocess.call(['cp','-r', template_directory, map_directory]) 
                except subprocess.CalledProcessError as e:
                    response['errors'].append(e.output)

                #try:
                #    subprocess.call(['mv', mapfile_directory + template + '.map', mapfile]) 
                #except subprocess.CalledProcessError as e:
                #    response['errors'].append(e.output)
                                          

                if len(response['errors']) == 0:
                    os.chdir(map_directory)

                    try:
                        MapManager.git_init(git_url)
                    except Exception, e:
                        response['errors'].append(str(e))

                    if len(response['errors']) == 0:
                        try:
                            MapManager.git_add_remote_url(git_url, user, password)
                        except Exception, e:
                            response['errors'].append(str(e))

                        if len(response['errors']) ==  0:
                            try:
                                #subprocess.check_output(['rm ' + mapfile_directory + '*.map'], shell=True, stderr=subprocess.STDOUT)
                                subprocess.check_output(['rm .gitignore'], shell=True, stderr=subprocess.STDOUT)
                            except subprocess.CalledProcessError as e:
                                pass

                            try:
                                response['logs'] += subprocess.check_output(['git pull origin master'], shell=True, stderr=subprocess.STDOUT)
                            except subprocess.CalledProcessError as e:
                                response['errors'].append(e.output)
                                response['logs'] = e.output

                            try:
                                subprocess.check_output(['rm ' + mapfile_directory + 'level*.map'], shell=True, stderr=subprocess.STDOUT)
                            except subprocess.CalledProcessError as e:
                                pass

                            try:
                                subprocess.check_output(['mv ' + mapfile_directory + '*.map ' + mapfile], shell=True, stderr=subprocess.STDOUT)
                            except subprocess.CalledProcessError as e:
                                pass 

                            if len(response['errors']) == 0:
                                response['status'] = 1

                        MapManager.git_remove_remote_url()

                        if len(response['errors']) == 0:
                            workspace_id = Workspace.by_name(self.request.userid).id

                            (projection, extent) = MapManager.get_proj_extent_from_mapfile(mapfile)

                            kwargs = {
                                'name': name,
                                'type': type,
                                'description': description,
                                'projection': projection,
                                'extent': extent,
                                'workspace_id': workspace_id,
                                'git_url': git_url
                            }

                            map = Map(**kwargs)

                            try:
                                DBSession.add(map)
                                response['status'] = 1
                            except exc.SQLAlchemyError as e:
                                response['errors'].append(e)

                    if len(response['errors']) != 0:
                        try:
                            subprocess.call(['rm','-r', map_directory]) 
                        except subprocess.CalledProcessError as e:
                            response['errors'].append(e.output)
                            response['status'] = 0
                            
        return response

    @view_config(
        route_name='maps.import',
        permission='view',
        renderer='json',
        request_method='POST'
    )
    def import_map(self):
        # Setup response
        response = {
            'status': 0,
            'errors': [],
            'logs': '',
            'id': ''
        }
        
        # Get some variables from the request    
        file_name = "import.zip"
        input_file = self.request.POST.get('input-file').file
        map_name = self.request.POST.get('import-name')
        workspace_name = self.request.userid
        workspaces_directory = self.request.registry.settings.get('workspaces.directory', '') + '/'
        
        # Upload the map

        file_path = '/tmp/' + file_name
        temp_file_path = file_path + '~'
        
        input_file.seek(0)
        with open(temp_file_path, 'wb') as output_file:
            shutil.copyfileobj(input_file, output_file)
            
        os.rename(temp_file_path, file_path)
        
        # Import the map to the disk (unzip)
        dest_dir = workspaces_directory + workspace_name + '/' + map_name
        
        if not os.path.exists(dest_dir):
            os.mkdir(dest_dir)
        
        map_zip = zipfile.ZipFile(file_path)
        for name in map_zip.namelist():
            (dir_name, file_name) = os.path.split(name)
            if dir_name:
                new_dir = dest_dir + '/' + dir_name
                if not os.path.exists(new_dir):
                    os.makedirs(new_dir)
            if file_name:
                dest_file = open(dest_dir + '/' + name, 'wb')
                dest_file.write(map_zip.read(name))
                dest_file.close()
        map_zip.close()
        os.remove(file_path)
        
        # Import the map to the DB
        with open(dest_dir + '/.exportData') as export_data:
            exdata_json = json.load(export_data)
            old_map_name = exdata_json['name']
            os.rename(dest_dir + '/map/' + old_map_name + '.map', dest_dir + '/map/' + map_name + '.map')
            current_workspace = Workspace.by_name(workspace_name)
            
            map_args = {
                'name': map_name,
                'type': exdata_json['type'],
                'description': exdata_json['description'],
                'projection': exdata_json['projection'],
                'extent': exdata_json['extent'],
                'workspace_id': current_workspace.id
            }
            
            map = Map(**map_args)
            
            try:
                DBSession.add(map)
                response['status'] = 1
            except exc.SQLAlchemyError as e:
                response['errors'].append(e)

        os.remove(dest_dir + '/.exportData')
        return response
        
    @view_config(
        route_name='maps.export',
        permission='view',
        renderer='json',
        request_method='POST'
    )
    def export_map(self):
        # Find the files and directories
        map = Map.by_id(self.matchdict.get('id')) #Value sent through the url
        workspace = Workspace.by_id(map.workspace_id)
        export_data = self.request.POST.get('export-data') #How much pdata to be sent (none, min, all)

        workspace_directory = self.request.registry.settings.get('workspaces.directory', '') + '/' + workspace.name + '/'
        map_directory = workspace_directory + map.name + '/'
        filename = str(map.name + '_'+datetime.datetime.now().strftime("%Y%m%d_%H%M%S")+'.zip')
            
        # Set up the logs
        export_log = logging.getLogger('export_log_'+map.name)
        handler = logging.FileHandler(map_directory + 'exportLogs.txt')
        formatter = logging.Formatter('[%(asctime)s] %(levelname)s:  %(message)s')
        handler.setFormatter(formatter)
        export_log.propagate = False;
        export_log.setLevel(logging.INFO)
        export_log.addHandler(handler)

        # Start the logs
        export_log.info("Starting export, file name will be "+filename)

        # Create the temporary file to store the zip
        with NamedTemporaryFile(delete=True) as output:
            map_zip = zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED)
            length_mapdir = len(map_directory)

            files_array = self.get_files_to_export(export_data, export_log, map, map_directory)
            
            # The part where the files are zipped
            export_log.info("Starting compression of " + str(len(files_array)) + " files (This might take a while)")
            nb_files_zipped = 0
            for file in files_array:
                try:
                    nb_files_zipped+=1
                    export_log.info("Compressing file "+str(nb_files_zipped)+"/" + str(len(files_array)) + " : " + file[length_mapdir:])
                    map_zip.write(file, file[length_mapdir:])
                except OSError:
                    pass
                    
            # Insert some data needed for import
            export_data_path = map_directory + ".exportData"
            with open(export_data_path, 'w') as export_data:
                export_log.info("Adding export info")
                map_data = {
                    'name': map.name,
                    'type': map.type,
                    'description': map.description,
                    'projection': map.projection,
                    'extent': map.extent,
                    'workspace_id': self.request.userid
                }
                export_data.write(json.dumps(map_data))
            map_zip.write(export_data_path, export_data_path[length_mapdir:])
            os.remove(export_data_path)
                    
            # Log current step
            export_log.info("Export finished, prompting user for download...")

            map_zip.close()

            # Send the response as an attachement to let the user download the file
            response = FileResponse(os.path.abspath(output.name))
            response.headers['Content-Type'] = 'application/download'
            response.headers['Content-Disposition'] = 'attachement; filename="'+filename+'"'
            
            #Close logs 
            export_log.info("END")
            handler.close()
            export_log.removeHandler(handler)
            
            #Return
            return response
    
    def get_files_to_export(self, export_data, export_log, map, map_directory):
        # This section adds every file included in the mapfile to the data_files array
        data_files = []
        length_mapdir = len(map_directory)
        
        # Not necessary if we export every file
        if export_data == 'min':
            # Log current step
            export_log.info("Looking for and adding the required data files...")
                
            data_names = []
            data_path = map_directory + 'map/'
            shapepath_found = False
            
            # Open the output mapfile
            with open(map_directory + "map/" + map.name + ".map") as ms_map:#mapserver syntax map
                for line in ms_map:
                    # Check if the shapepath is there (if it hasn't been found already)
                    if not shapepath_found:
                        result = re.search(r'(^ *SHAPEPATH.*) [\'"](.*)[\'"]', line, flags=re.MULTILINE)
                        if result:
                            data_path = os.path.join(data_path, result.group(2))
                            shapepath_found = True
                    # get all DATA lines
                    result = re.search(r'(^ *DATA.*) [\'"](.*)[\'"]', line, flags=re.MULTILINE)
                    if result and result.group(2) not in data_names:
                        data_names.append(result.group(2))
                for file in data_names:
                    # For every data line found, get all the actual files
                    file_path = os.path.join(data_path, file)
                    
                    # If the path points to a single file
                    if os.path.isfile(file_path):
                        data_files.append(file_path)
                    else:
                        # Group of files
                        sub_files = glob.glob(file_path + '.*')
                        if sub_files:
                            for sub_file in sub_files:
                                data_files.append(sub_file)
                                export_log.info("Adding file: " + sub_file[length_mapdir:])
                        else:
                            # Log error
                            export_log.warning('Could not find ' + file_path + '')
        
        # Log current step
        export_log.info("Adding main files...")
        
        # Add the main files, pdata if export_map = all
        files_array = []
        for root, dirs, files in os.walk(map_directory, followlinks=True):
            if export_data in ['none', 'min'] and 'pdata' in dirs:
                dirs.remove('pdata')
            if export_data == 'min':
                #Add required data files
                for data_file in data_files:
                    data_files.remove(data_file)
                    files.append(data_file)
            for file in files:
                if "exportLogs.txt" not in file:
                    files_array.append(os.path.join(root, file))
        
        return files_array
    
    @view_config(
        route_name='maps.logs.view',
        permission='view',
        renderer='json',
        request_method='POST'
    )
    def view_logs(self):
        #Find the log file
        map = Map.by_id(self.matchdict.get('id')) #Value sent through the url
        workspace = Workspace.by_id(map.workspace_id)
        start = int(self.request.POST.get('start')) #Where to start the logs
        
        workspace_directory = self.request.registry.settings.get('workspaces.directory', '') + '/' + workspace.name + '/'
        map_directory = workspace_directory + map.name + '/'
        log_path = map_directory + 'exportLogs.txt'
        
        #Open and read the logs
        if os.path.isfile(log_path):
            with open(log_path, "r") as log_file:
                log_content = log_file.read()
                
            return log_content[start:]
        else: return
        
                
    @view_config(
        route_name='maps.logs.delete',
        permission='view',
        renderer='json',
        request_method='POST'
    )
    def delete_logs(self):
        #Find the log file
        map = Map.by_id(self.matchdict.get('id')) #Value sent through the url
        workspace = Workspace.by_id(map.workspace_id)
        
        workspace_directory = self.request.registry.settings.get('workspaces.directory', '') + '/' + workspace.name + '/'
        map_directory = workspace_directory + map.name + '/'
        
        # Clear the logs
        os.remove(map_directory + 'exportLogs.txt')
        
    @view_config(
        route_name='maps.pois.new',
        permission='view',
        renderer='json',
        request_method='POST'
    )
    def new_poi(self):
        response = {
            'status': 0,
            'errors': []
            }

        map = Map.by_id(self.matchdict.get('id'))
        workspace = Workspace.by_id(map.workspace_id)

        if(workspace.name == self.request.userid):
            try:
                name = self.request.POST.get('name')
            except KeyError as e:
                response['errors'].append('A name is required.')

            try:
                lon = self.request.POST.get('lon')
            except KeyError as e:
                response['errors'].append('A longitude is required.')

            try:
                lat = self.request.POST.get('lat')
            except KeyError as e:
                response['errors'].append('A latitude is required.')

            if len(response['errors']) == 0:
                try:
                    scale = self.request.POST.get('scale')
                except KeyError as e:
                    scale = None

                try:
                    projection = self.request.POST.get('projection')
                except KeyError as e:
                    projection = None


                poi_line = name + ',' + lon + ',' + lat
                if scale:
                    poi_line += ',' + scale
                if projection:
                    if not scale:
                        poi_line += ','
                    poi_line += ',' + projection

                workspace_directory = self.request.registry.settings.get('workspaces.directory', '') + '/' + workspace.name + '/'
                map_directory = workspace_directory + map.name + '/'
                poi_file = map_directory + 'poi'

                try:
                    with codecs.open(poi_file, encoding='utf8', mode='a') as f:
                        f.write('\n' + poi_line)
                        f.close()
                except IOError:
                    response['errors'].append("An error occured while opening '" + poi_file + "' file.")


                if len(response['errors']) == 0:
                    response['status'] = 1

        else:
            response['errors'].append('Access denied.')

        return response

    @view_config(
        route_name='maps.pois.delete',
        permission='view',
        renderer='json',
        request_method='POST'
    )
    def delete_poi(self):
        response = {
            'status': 0,
            'errors': []
            }

        map = Map.by_id(self.matchdict.get('id'))
        workspace = Workspace.by_id(map.workspace_id)

        if(workspace.name == self.request.userid):
            try:
                name = self.request.POST.get('name')
            except KeyError as e:
                response['errors'].append('A name is required.')

            if len(response['errors']) == 0:
                workspace_directory = self.request.registry.settings.get('workspaces.directory', '') + '/' + workspace.name + '/'
                map_directory = workspace_directory + map.name + '/'
                poi_file = map_directory + 'poi'

                try:
                    output = []
                    with codecs.open(poi_file, encoding='utf8', mode='r') as f:
                       for line in f:
                           if not line.startswith(name+","):
                                output.append('\n' + line)
                       f.close()
                    with codecs.open(poi_file, encoding='utf8', mode='w') as f:
                        for o in output:
                            f.write(o)
                        f.close()
                     
                               
                except IOError:
                    response['errors'].append("An error occured while opening '" + poi_file + "' file.")


                if len(response['errors']) == 0:
                    response['status'] = 1

        else:
            response['errors'].append('Access denied.')

        return response



    @view_config(
        route_name='maps.debug.get',
        permission='view',
        renderer='json',
        request_method='GET'
    )
    def get_map_debug(self):
        response = {
            'status': 0,
            'errors': [],
            'debug': ''
            }

        map = Map.by_id(self.matchdict.get('id'))
        workspace = Workspace.by_id(map.workspace_id)

        if(workspace.name == self.request.userid):
            workspace_directory = self.request.registry.settings.get('workspaces.directory', '') + '/' + workspace.name + '/'
            map_directory = workspace_directory + map.name + '/'
            mapfile_directory = map_directory + 'map/'
            mapfile = mapfile_directory + map.name + '.map'

            try:
                debug = MapManager.get_debug_from_mapfile(mapfile, mapfile_directory)
            except Exception, e:
                response['errors'].append(str(e)) 

            
            if len(response['errors']) == 0:
                response['debug'] = debug
                response['status'] = 1
        else:
            response['errors'].append('Access denied.')

        return response


    @view_config(
        route_name='maps.debug.reset',
        permission='view',
        renderer='json',
        request_method='GET'
    )
    def reset_map_debug(self):
        response = {
            'status': 0,
            'errors': []
            }

        map = Map.by_id(self.matchdict.get('id'))
        workspace = Workspace.by_id(map.workspace_id)

        if(workspace.name == self.request.userid):
            workspace_directory = self.request.registry.settings.get('workspaces.directory', '') + '/' + workspace.name + '/'
            map_directory = workspace_directory + map.name + '/'
            mapfile_directory = map_directory + 'map/'
            mapfile = mapfile_directory + map.name + '.map'

            try:
                MapManager.set_debug_from_mapfile(mapfile, mapfile_directory, '')
            except Exception, e:
                response['errors'].append(str(e)) 

            
            if len(response['errors']) == 0:
                response['status'] = 1
        else:
            response['errors'].append('Access denied.')

        return response
