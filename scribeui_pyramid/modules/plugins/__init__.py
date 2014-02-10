# -*- coding: utf-8 -*-

""" Uncomment those if needed """
#from ..app.sqla import DBSession
#from ..maps.models import Map
#from ..workspaces.models import Workspace

def includeme(config):
    config.scan('.')

#Specify here any javascript files you wish to be included in the index page.
def getJsFiles(request):
    return [
        request.static_url('scribeui_pyramid:static/setextent/static/js/setExtent.js')    
    ]

#Specify here any CSS files you wish to be included in the index page.
def getCssFiles(request):
    return [
        request.static_url('scribeui_pyramid:static/setextent/static/css/setextent.css')    
    ]
