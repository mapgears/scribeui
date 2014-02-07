# -*- coding: utf-8 -*-
import datetime as dt
from datetime import datetime
from time import time

from pyramid.authentication import AuthTktAuthenticationPolicy
from pyramid.authorization import ACLAuthorizationPolicy

from pyramid.config import Configurator
from pyramid.session import UnencryptedCookieSessionFactoryConfig
import json


def integers_predicate(*segment_names):
    def predicate(info, request):
        match = info['match']
        for segment_name in segment_names:
            try:
                match[segment_name] = int(match[segment_name])
            except (TypeError, ValueError):
                return False
        return True
    return predicate

int_predicate = integers_predicate('id')


def get_rid():
    rid = int(time())
    return rid


def jinja_getattr(item, attr):
    if isinstance(item, dict):
        value = item[attr] if attr in item else None
    else:
        parts = attr.split('.')
        value = item
        for i in range(0, len(parts)):
            value = getattr(value, parts[i])

    if type(value) == datetime:
        return datetime.strftime(value, '%Y-%m-%d %H:%M')
    elif type(value) == dt.date:
        return datetime.strftime(value, '%Y-%m-%d')
    else:
        return value


def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """
    authn_policy = AuthTktAuthenticationPolicy('seekrit')
    authz_policy = ACLAuthorizationPolicy()
    my_session_factory = UnencryptedCookieSessionFactoryConfig('itsaseekreet')
    config = Configurator(
        settings=settings,
        root_factory='scribeui_pyramid.modules.app.resources.RootFactory',
        authentication_policy=authn_policy,
        authorization_policy=authz_policy,
        session_factory=my_session_factory
    )
    config.include('pyramid_jinja2')
    config.include('.modules')
    config.add_jinja2_search_path("scribeui_pyramid:templates")
    environment = config.get_jinja2_environment()
    environment.globals['time'] = get_rid()
    environment.globals['getattr'] = jinja_getattr
    config.add_static_view(
        'static',
        'scribeui_pyramid:static',
        cache_max_age=3600
    )
    return config.make_wsgi_app()
