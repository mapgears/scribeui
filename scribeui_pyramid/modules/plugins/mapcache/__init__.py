# -*- coding: utf-8 -*-
from .. import DBSession
from .. import Map
from .. import Workspace
from .models import (
    Job,
    DatabaseConfig
)

def routes_plugins(config):
    config.add_route('mapcache.startjob', '/mapcache/startjob')
    config.add_route('mapcache.getjobs', '/mapcache/getjobs')
    config.add_route('mapcache.stopjob', '/mapcache/stopjob')
    config.add_route('mapcache.clearjob', '/mapcache/clearjob')
    config.add_route('mapcache.getLayers', '/mapcache/getlayers')
    config.add_route('mapcache.tiles', '/mapcache/tiles')
    config.add_route('mapcache.database.config.save', '/mapcache/database/config/save')
    config.add_route('mapcache.database.config.delete', '/mapcache/database/config/delete')
    config.add_route('workspaces.mapcache.database.config.get', '/workspaces/mapcache/database/config/get')
    config.add_route('mapcache.grids.get', '/mapcache/grids/get')

def includeme(config):
    config.scan('.')
    config.include(routes_plugins, route_prefix='api')
	

class JobManager(object):

    @staticmethod
    def createTable():
        engine = DBSession.bind
        Job.__table__.create(bind=engine, checkfirst=True)
        return


class DatabaseConfigManager(object):

    @staticmethod
    def createTable():
        engine = DBSession.bind
        DatabaseConfig.__table__.create(bind=engine, checkfirst=True)
        return

JobManager.createTable()
DatabaseConfigManager.createTable()
