# -*- coding: utf-8 -*-


class UIObject(object):
    def __init__(self, **kwargs):
        for k, v in kwargs.iteritems():
            if hasattr(self, k):
                setattr(self, k, v)


class PageAction(UIObject):
    name = None
    icon = None
    url = None
    items = None


class FormTab(UIObject):
    name = None
    url = None
    active = False


class FormButton(UIObject):
    name = None
    icon = None
    url = None
    klass = None


class LinkButton(UIObject):
    name = None
    icon = None
    url = None
    klass = None
    items = None


class Table(UIObject):
    name = None
    url = None
    attributes = None
    results = None
    table_id = None
    has_datepicker = False
    has_sort = True
    has_search = True
    has_page = True
    add_row = False
    edit_row = False
    delete_row = False
    after_delete = None
    after_save = None
