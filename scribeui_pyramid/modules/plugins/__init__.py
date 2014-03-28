# -*- coding: utf-8 -*-

from ..app.sqla import (
    DBSession,
    Base,
    BaseMixin
)
from ..maps.models import Map
from ..workspaces.models import Workspace

def includeme(config):
    config.include('.setextent')
    config.include('.mapcache')

#Specify here any javascript files you wish to be included in the index page.
def getJsFiles(request):
    return [
        request.static_url('scribeui_pyramid:static/setextent/static/js/setExtent.js'),
        request.static_url('scribeui_pyramid:static/mapcache/static/js/mapcacheViewer.js'),
        request.static_url('scribeui_pyramid:static/mapcache/static/js/mapcache.js')
    ]

#Specify here any CSS files you wish to be included in the index page.
def getCssFiles(request):
    return [
        request.static_url('scribeui_pyramid:static/setextent/static/css/setextent.css'),
        request.static_url('scribeui_pyramid:static/mapcache/static/css/mapcache.css'),
        request.static_url('scribeui_pyramid:static/mapcache/static/css/mapcacheViewer.css')    
    ]
