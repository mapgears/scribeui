# -*- coding: utf-8 -*-
import sqlalchemy as sa

from ..app.sqla import (
    DBSession,
    Base,
    BaseMixin
)


class Map(Base, BaseMixin):

    __tablename__ = 'maps'
    id = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    name = sa.Column(sa.Unicode(30), nullable=False)
    type = sa.Column(sa.Unicode(30), nullable=False)
    description = sa.Column(sa.Unicode())
    projection = sa.Column(sa.Unicode())
    extent = sa.Column(sa.Unicode(50))
    git_url = sa.Column(sa.Unicode())

    workspace_id = sa.Column(sa.Integer, sa.ForeignKey('workspaces.id'),
                             nullable=False)

    def __repr__(self):
        return u"<Map('{0}')>".format(self.name)


    @classmethod
    def by_name(cls, name):
        q = DBSession.query(cls)\
            .filter(sa.func.lower(cls.name) == name.lower())

        return q.first()
