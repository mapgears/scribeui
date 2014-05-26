# -*- coding: utf-8 -*-
def routes_plugins(config):
	#config.add_route('setextent.test', '/setextent/test')
	pass
    

def includeme(config):
    #config.include(routes_plugins, route_prefix='plugins')
    config.scan('.')
