# -*- coding: utf-8 -*-
import re

def routes_api(config):
    config.add_route('workspaces.new', '/workspaces/new')
    config.add_route('workspaces.all', '/workspaces/all')
    config.add_route('workspace.maps', '/workspace/maps')
    config.add_route('workspaces.delete', '/workspaces/delete')

def includeme(config):
    #config.include(routes)
    config.include(routes_api, route_prefix='api')
    config.scan('.')


class WorkspaceManager(object):
    """Class to handle non-instance workspace functions"""

    @staticmethod
    def is_valid_name(name):
        return re.match("^[A-Za-z0-9][A-Za-z0-9_-]{1,99}$", name) is not None
