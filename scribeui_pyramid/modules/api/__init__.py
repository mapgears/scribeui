# -*- coding: utf-8 -*-
from scribeui_pyramid import int_predicate


def api(config):
    config.add_route('api.dummy','dummy')


def includeme(config):
    config.include(api, route_prefix='api')
    config.scan('.')
