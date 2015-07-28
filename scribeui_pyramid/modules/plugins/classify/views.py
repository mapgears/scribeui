from pyramid.view import view_config
from osgeo import gdal, ogr

class ClassifyView(object):
    def __init__(self, request):
        self.request = request

    @view_config(
        route_name='classify.attributes.get',
        permission='view',
        renderer='json',
        request_method='POST'
    )
    def get_attributes(self):
        response = {
            'status': 0,
            'errors': [],
            'attributes': {}
            }

        file = (self.request.registry.settings.get('workspaces.directory', '')
            + '/' + self.request.POST.get('workspace_name')
            + '/' + self.request.POST.get('map_name')
            + '/' + 'map/'
            + self.request.POST.get('datasource'))

        # Open the datasource
        datasource = ogr.Open(file)
        if not datasource:
            datasource = ogr.Open(file + '.shp')
            if not datasource:
                response['errors'].append("No shapefile found for " + file)
                return response
        layer = datasource.GetLayer()
        layer_defn = layer.GetLayerDefn()
        field_names = [layer_defn.GetFieldDefn(i).GetName() for i in range(layer_defn.GetFieldCount())]
        return field_names
