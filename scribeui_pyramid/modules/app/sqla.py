# -*- coding: utf-8 -*-
from datetime import (
    date,
    datetime
)

from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import (
    scoped_session,
    sessionmaker,
)
from sqlalchemy import engine_from_config
import sqlalchemy as sa

from zope.sqlalchemy import ZopeTransactionExtension

from .interfaces import IDBSession

DBSession = scoped_session(sessionmaker(extension=ZopeTransactionExtension()))
Base = declarative_base()


def get_session(request):
    if request.registry.queryUtility(IDBSession):
        session = request.registry.getUtility(IDBSession)
        return session
    else:
        raise Exception(
            'You need to register a DBSession to IDBSession interface'
        )


def init_sqla(settings):
    engine = engine_from_config(settings, 'sqlalchemy.')
    DBSession.configure(bind=engine)
    Base.metadata.bind = engine


class BaseMixin(object):

    query = DBSession.query_property()

    def __props__(self, convert_date=False):
        props = {}
        blacklist = ['password']
        for key in self.__dict__:
            if key in blacklist:
                continue
            if not key.startswith('__') and not key.startswith('_sa_'):
                obj = getattr(self, key)
                if isinstance(obj, datetime) or isinstance(obj, date):
                    if convert_date:
                        props[key] = obj.isoformat()
                    else:
                        props[key] = getattr(self, key)
                else:
                    props[key] = getattr(self, key)
        return props

    def __todict__(self):
        """Method to turn an SA instance into a dict
        so we can output to json"""

        def convert_datetime(value):
            """We need to treat datetime's special to get them to json"""
            if value:
                return value.strftime('%Y-%m-%d')
            else:
                return ""

        for col in self.__table__.columns:
            if isinstance(col.type, sa.DateTime) or \
                    isinstance(col.type, sa.Date):
                value = convert_datetime(getattr(self, col.name))
            else:
                value = getattr(self, col.name)

            yield(col.name, value)

    def __iter__(self):
        """Returns an iterable that supports .next()
        so we can do dict(sa_instance)

        """
        return self.__todict__()

    def __json__(self, request):
        return dict(self)

# not tested..
    def fromdict(self, values):
        """Merge in items in the values dict into our object

        if it's one of our columns

        """
        for col in self.__table__.columns:
            if col.name in values:
                setattr(self, col.name, values[col.name])

    @classmethod
    def all(cls, page=None, limit=None):
        """Get all objects from the system

        :param page: pagination page number. Start at 1.

        :param limit: pagination page limit. Start at 1.
        """

        query = DBSession.query(cls)

        if limit:
            query = query.limit(limit)
        if page and limit:
            offset = (page - 1) * limit
            query = query.offset(offset)

        return query.all()

    @classmethod
    def by_id(cls, id):
        """Get an object from the system via the id"""

        return cls.query.filter(cls.id == id).one()


def includeme(config):
    settings = config.registry.settings
    init_sqla(settings)
    config.registry.registerUtility(DBSession, IDBSession)
