# -*- coding: utf-8 -*-


def routes(config):
    config.add_route('auth.login', '/login')
    config.add_route('auth.logout', '/logout')


def includeme(config):
    config.include(routes, route_prefix='/auth')
    config.scan('.')
