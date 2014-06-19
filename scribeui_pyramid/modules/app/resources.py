# -*- coding: utf-8 -*-
from pyramid.security import Allow
from pyramid.security import Authenticated


class RootFactory(object):

    def __init__(self, request):
        self.request = request
        self.__acl__ = [
            (Allow, Authenticated, u'view'),
            (Allow, Authenticated, u'add'),
            (Allow, Authenticated, u'edit'),
            (Allow, Authenticated, u'delete'),
            (Allow, Authenticated, u'all'), ]

