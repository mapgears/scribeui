# -*- coding: utf-8 -*-
import re
import subprocess

from  werkzeug import url_fix

from scribeui_pyramid import int_predicate

def routes_api(config):
    config.add_route('maps.new', '/maps/new')
    config.add_route('maps.open', '/maps/open/{id}',
                     custom_predicates=(int_predicate,))
    config.add_route('maps.delete', '/maps/delete/{id}',
                     custom_predicates=(int_predicate,))
    config.add_route('maps.groups.update', '/maps/{id}/groups/update',
                     custom_predicates=(int_predicate,))
    config.add_route('maps.save', '/maps/save/{id}',
                     custom_predicates=(int_predicate,))
    config.add_route('maps.configure', '/maps/configure/{id}',
                     custom_predicates=(int_predicate,))
    config.add_route('maps.commit', '/maps/commit/{id}',
                     custom_predicates=(int_predicate,))
    config.add_route('maps.pull', '/maps/pull/{id}',
                     custom_predicates=(int_predicate,))
    config.add_route('maps.clone', '/maps/clone')
    config.add_route('maps.pois.new', '/maps/{id}/pois/new',
                     custom_predicates=(int_predicate,))

def includeme(config):
    config.include(routes_api, route_prefix='api')
    config.scan('.')


class MapManager(object):
    """Class to handle non-instance map functions"""

    @staticmethod
    def is_valid_name(name):
        return re.match("^[A-Za-z0-9][A-Za-z0-9_-]{1,99}$", name) is not None


    @staticmethod
    def get_proj_extent_from_mapfile(mapfile):
        projection = None
        extent = None

        try:
            f = open(mapfile)
            lines = f.readlines()
            
            for line in lines:
                line = line.strip()

                if line.find('init=') != -1:
                    projection = line[6:-1].strip()

                index_extent = line.find('EXTENT')
                if index_extent != -1:
                    extent = line[index_extent + 6:].replace(':', '').strip().replace(' ', ',')

                if projection and extent:
                    break

            f.close();
        except:
            pass

        return (projection, extent)


    @staticmethod
    def get_urls(name, projection, extent, mapfile_directory, mapserver_url):
        url = mapserver_url+ '?map=' + mapfile_directory

        if projection and extent:
            thumbnail_url = url + '&LAYERS=default&FORMAT=image/png&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap'
            thumbnail_url += '&SRS=' + projection + '&BBOX=' + extent + '&WIDTH=200&HEIGHT=200&EXCEPTIONS=application/vnd.ogc.se_blank'
        else:
            thumbnail_url = None

        return (url, thumbnail_url)


    @staticmethod
    def get_scribe_files():
        return {
            'scales':'editor/scales',
            'variables':'editor/variables',
            'map':'editor/map',
            'projections':'epsg', 
            'fonts':'fonts.lst',
            'symbols':'symbols.map',
            'readme':'README.markdown'
            }
            

    @staticmethod
    def get_standard_files(name):
        return {
            'map':'map/' + name + '.map',
            'scales':'scales',
            'projections':'epsg',
            'fonts':'fonts.lst',
            'symbols':'symbols.map',
            'readme':'README'
            }


    @classmethod
    def git_init(cls, url):
        # remove remote origin
        cls.git_remove_remote_url()

        # init new git
        try:
            subprocess.check_output(['git init'], shell=True, stderr=subprocess.STDOUT)
        except subprocess.CalledProcessError as e:
            raise Exception(e.output)

        gitignore = open('.gitignore', 'w+')
        gitignoreContent = 'data\n'
        gitignoreContent += 'pdata\n'
        gitignoreContent += 'debugFile.log\n'
        gitignore.write(gitignoreContent)

        return True


    @classmethod
    def git_remove_remote_url(cls):
        try:
            subprocess.check_output(['git remote rm origin'], shell=True, stderr=subprocess.STDOUT)
        except subprocess.CalledProcessError as e:
            pass
            #raise Exception(e.output)

        return True


    @classmethod
    def git_add_remote_url(cls, url, user, password):
        # link new git to remote url
        # user/password are coded directly in the git url
        if user and password:
            user = url_fix(user)
            password = url_fix(password)
            user_string = user
            if password != '':
                user_string += ':' + password
            user_string += '@'
            git_full_url = 'https://' + user_string + url[8:]
        else:
            git_full_url = url

        cls.git_remove_remote_url()
        print user
        print password
        print git_full_url
        print '\n\n\n'
        try:
            subprocess.check_output(['git remote add origin ' + git_full_url], shell=True, stderr=subprocess.STDOUT)
        except subprocess.CalledProcessError as e:
            raise Exception(e.output)

        try:
            subprocess.check_output(['git config http.sslVerify "false"'], shell=True, stderr=subprocess.STDOUT)
        except subprocess.CalledProcessError as e:
            raise Exception(e.output)

        return True