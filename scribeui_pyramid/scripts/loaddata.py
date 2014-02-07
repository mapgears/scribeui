# -*- coding: utf-8 -*-
import os
import sys

from fixture import SQLAlchemyFixture
from dataset import (
    WorkspaceData,
    MapData
)

from sqlalchemy import (
    engine_from_config,
    MetaData
)

from pyramid.paster import (
    get_appsettings,
    setup_logging
)

from ..modules.app.sqla import DBSession

from scribeui_pyramid.modules.workspaces.models import Workspace
from scribeui_pyramid.modules.maps.models import Map

def usage(argv):
    cmd = os.path.basename(argv[0])
    print('usage: %s <config_uri>\n'
          '(example: "%s development.ini")' % (cmd, cmd))
    sys.exit(1)


def main(argv=sys.argv):
    if len(argv) != 2:
        usage(argv)
    config_uri = argv[1]
    setup_logging(config_uri)
    settings = get_appsettings(config_uri)
    engine = engine_from_config(settings, 'sqlalchemy.')
    metadata = MetaData()
    metadata.bind = engine
    DBSession.configure(bind=engine)
    metadata.create_all()
    dbfixture = SQLAlchemyFixture(
        env={
            'WorkspaceData': Workspace,
            'MapData': Map
            },
        engine=metadata.bind)
    data = dbfixture.data(
        WorkspaceData,
        MapData
        )
    data.setup()

    
