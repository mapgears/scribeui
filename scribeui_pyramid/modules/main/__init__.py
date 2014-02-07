# -*- coding: utf-8 -*-
from ..app.navbar import NavItem

import sqlalchemy as sa

from ..app.sqla import Base

def routes(config):
    config.add_route('home', '/')

def includeme(config):
    #navbar = config.get_navbar() 
    config.include(routes)
    config.scan('.')
