# -*- coding: utf-8 -*-
from operator import attrgetter

from ..webui.ui import UIObject
from .interfaces import INavBar


class NavItem(UIObject):
    name = None
    icon = None
    route_name = None
    params = None
    url = None
    active = False
    items = None
    sort_weight = 0
    permission = None
    widget = None


class NavBar(object):

    def __init__(self):
        self.request = None
        self._items = []

    def set_request(self, request):
        self.request = request

    def set_urls(self, items):
        for item in items:
            if item.items:
                self.set_urls(item.items)
            if self.request:
                if item.params:
                    item.url = self.request.route_url(item.route_name, **item.params)
                else:
                    item.url = self.request.route_url(item.route_name)

    def add(self, item):
        self._items.append(item)

    @property
    def items(self):
        self.set_urls(self._items)
        return sorted(self._items, key=attrgetter('sort_weight', 'name'))


def get_navbar_from_config(config):
    return config.registry.queryUtility(INavBar)


def get_navbar_from_request(request):
    return request.registry.queryUtility(INavBar)


def get_navbar(request):
    navbar = get_navbar_from_request(request)
    navbar.set_request(request)
    return navbar


def includeme(config):
    config.registry.registerUtility(NavBar(), INavBar)
    config.add_directive('get_navbar', get_navbar_from_config)
    config.add_request_method(
        get_navbar,
        'navbar',
        property=True
    )
