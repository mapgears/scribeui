# -*- coding: utf-8 -*-
from cryptacular.bcrypt import BCRYPTPasswordManager
from cryptacular.core import DelegatingPasswordManager

import sqlalchemy as sa

from ..app.sqla import (
    DBSession,
    Base,
    BaseMixin
)

from ..maps.models import Map


class Workspace(Base, BaseMixin):

    __tablename__ = 'workspaces'
    id = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    name = sa.Column(sa.Unicode(30), nullable=False, unique=True)
    password = sa.Column(sa.Unicode(256))


    def __repr__(self):
        return u"<Workspace('{0}')>".format(self.name)


    @staticmethod
    def password_manager():
        return DelegatingPasswordManager(preferred=BCRYPTPasswordManager())


    @staticmethod
    def encode_password(raw):
        return Workspace.password_manager().encode(raw)


    @staticmethod
    def check_password(hashed, raw):
        return Workspace.password_manager().check(
            hashed,
            raw,
            setter=Workspace.encode_password
        )


    @classmethod
    def authenticate(cls, name, password):
        workspace = DBSession.query(cls)\
            .filter_by(name=name)\
            .first()

        if workspace:
            if workspace.password and password and Workspace.check_password(workspace.password, password):
                return workspace
            elif not workspace.password and not password:
                return workspace
        return None


    @classmethod
    def by_name(cls, name):
        q = DBSession.query(cls)\
            .filter(sa.func.lower(cls.name) == name.lower())

        return q.first()


    def get_maps(self, type=None):
        q = Map.query.filter(Map.workspace_id == self.id)

        if type:
            q = q.filter(Map.type == type)

        return q.all()


    def get_map_by_name(self, name):
        q = DBSession.query(Map)\
            .filter(Map.name == name.lower(), Map.workspace_id == self.id)

        return q.first()