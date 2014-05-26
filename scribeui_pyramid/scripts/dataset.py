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
        extent = '-20405648.939901,-17712669.979681,20314497.045109,19408951.476421'
        projection = 'EPSG:900913'
        workspace_id = 1

    class standard:
        name = u'standard'
        description = u'Standard map'
        type = u'Standard'
        extent = '-20405648.939901,-17712669.979681,20314497.045109,19408951.476421'
        projection = 'EPSG:900913'
        workspace_id = 1

    class wms:
        name = u'WMS'
        description = u'WMS viewer template'
        type = u'Standard'
        extent = '-20405648.939901,-17712669.979681,20314497.045109,19408951.476421'
        projection = 'EPSG:900913'
        workspace_id = 1