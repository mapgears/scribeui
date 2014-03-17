# -*- coding: utf-8 -*-
from .. import DBSession
from .models import Job

def routes_plugins(config):
    config.add_route('mapcache.startjob', '/mapcache/startjob')
    config.add_route('mapcache.getjobs', '/mapcache/getjobs')
    config.add_route('mapcache.stopjob', '/mapcache/stopjob')
    config.add_route('mapcache.clearjob', '/mapcache/clearjob')
    

def includeme(config):
    config.include(routes_plugins, route_prefix='api')
    config.scan('.')

class JobManager(object):

    @staticmethod
    def createTable():
        engine = DBSession.bind
        Job.__table__.create(bind=engine, checkfirst=True)
        return

JobManager.createTable()
