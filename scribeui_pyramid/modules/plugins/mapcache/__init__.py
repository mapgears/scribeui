# -*- coding: utf-8 -*-
from .models import (
    Job,
    DatabaseConfig
)
from scribeui_pyramid.modules.app.sqla import DBSession


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
    config.add_static_view(name='mapcache', path='static')
    config.include(routes_plugins, route_prefix='api')
	

def getIncludedFiles():
    return {'css':['mapcache/css/mapcache.css','mapcache/css/mapcacheViewer.css'],
            'js': ['mapcache/js/mapcache.js', 'mapcache/js/mapcacheViewer.js']}

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
