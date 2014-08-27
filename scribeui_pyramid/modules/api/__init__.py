# -*- coding: utf-8 -*-


def api(config):
    config.add_route('api.dummy','dummy')


def includeme(config):
    config.include(api, route_prefix='api')
    config.scan('.')
