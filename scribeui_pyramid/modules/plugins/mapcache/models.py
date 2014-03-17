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