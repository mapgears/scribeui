# -*- coding: utf-8 -*-

def routes(config):
    config.add_route('home', '/')

def includeme(config):
    #navbar = config.get_navbar() 
    config.include(routes)
    config.scan('.')
