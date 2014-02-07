# -*- coding: utf-8 -*-
from fixture import DataSet

from scribeui_pyramid.modules.workspaces.models import Workspace

class WorkspaceData(DataSet):
    class default:
        name = u'default'
        password = Workspace.encode_password(u'default')


class MapData(DataSet):
    class default:
        name = u'default'
        description = u'Default map'
        type = u'Scribe'
        extent = '-8197285.4456571,5695806.3467685,-8184591.9930116,5705655.9111164'
        projection = 'EPSG:900913'
        workspace_id = 1

    class standard:
        name = u'standard'
        description = u'Standard map'
        type = u'Standard'
        extent = '-8197285.4456571,5695806.3467685,-8184591.9930116,5705655.9111164'
        projection = 'EPSG:900913'
        workspace_id = 1