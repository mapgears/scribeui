from pyramid.view import view_config
from osgeo import ogr
from sets import Set

class ClassifyView(object):
    def __init__(self, request):
        self.request = request

    @view_config(
        route_name='classify.field.getlist',
        permission='view',
        renderer='json',
        request_method='POST'
    )
    def get_fields(self):
        response = {
            'status': 0,
            'errors': [],
            'fields': {}
            }

        file = (self.request.registry.settings.get('workspaces.directory', '')
            + '/' + self.request.POST.get('datasource'))

        # Open the datasource
        datasource = ogr.Open(file)
        if not datasource:
            datasource = ogr.Open(file + '.shp')
            if not datasource:
                response['errors'].append("No shapefile found for " + self.request.POST.get('datasource'))
                return response
        layer = datasource.GetLayer()
        layer_defn = layer.GetLayerDefn()
        response['fields'] = [layer_defn.GetFieldDefn(i).GetName() for i in range(layer_defn.GetFieldCount())]
        response['status'] = 1
        return response

    @view_config(
        route_name='classify.field.getinfo',
        permission='view',
        renderer='json',
        request_method='POST'
    )
    def get_field_info(self):
        response = {
            'status': 0,
            'errors': [],
            'geom_type': '',
            'minimum': None,
            'maximum': None,
            'nb_values': None,
            'unique_values': None
            }

        file = (self.request.registry.settings.get('workspaces.directory', '')
            + '/' + self.request.POST.get('datasource'))
        field = self.request.POST.get('field').encode('utf-8', 'ignore')

        # Open the datasource
        datasource = ogr.Open(file)
        if not datasource:
            datasource = ogr.Open(file + '.shp')
            if not datasource:
                response['errors'].append("No shapefile found for " + file)
                return response
        layer = datasource.GetLayer()
        layer_defn = layer.GetLayerDefn()
        field_defn = layer_defn.GetFieldDefn(layer_defn.GetFieldIndex(field))
        response['geom_type'] = field_defn.GetTypeName()

        unique_values = Set()
        for i in range(layer.GetFeatureCount()):
            feature = layer.GetFeature(i)
            field_value = feature.GetField(field)
            if type(field_value) is str:
                field_value = field_value.decode('utf-8', 'ignore')
            unique_values.add(field_value)

        response['nb_values'] = i
        response['unique_values'] = len(unique_values)

        if response['geom_type'] in ['Real', 'Integer']:
            response['maximum'] = max(unique_values)
            response['minimum'] = min(unique_values)

        response['status'] = 1

        return response
