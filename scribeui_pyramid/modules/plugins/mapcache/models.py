# -*- coding: utf-8 -*-
import sqlalchemy as sa

from .. import (
    DBSession,
    Base,
    BaseMixin
)

class Job(Base, BaseMixin):
    __tablename__ = 'jobs'

    id = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    title = sa.Column(sa.Unicode(255), nullable=False)
    status = sa.Column(sa.Integer, nullable=False)

    map_id = sa.Column(sa.Integer, sa.ForeignKey('maps.id'),
                             nullable=False)

    def __repr__(self):
        return u"<Job('{0}')>".format(self.title)


class DatabaseConfig(Base, BaseMixin):
    __tablename__ = 'database_configs'

    id = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    name = sa.Column(sa.Unicode(255), nullable=False)
    type = sa.Column(sa.Unicode())
    host = sa.Column(sa.Unicode())
    port = sa.Column(sa.Integer)
    database_name = sa.Column(sa.Unicode())
    user = sa.Column(sa.Unicode())
    query = sa.Column(sa.Unicode())

    workspace_id = sa.Column(sa.Integer, sa.ForeignKey('workspaces.id'),
                             nullable=False)

    def __repr__(self):
        return u"<DatabaseConfig('{0}')>".format(self.name)