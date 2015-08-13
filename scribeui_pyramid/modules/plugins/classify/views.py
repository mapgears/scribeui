from pyramid.view import view_config
from osgeo import ogr
from sets import Set
import collections
import re

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
        connection = self.request.POST.get('connection')
        original_datasource = self.request.POST.get('original_datasource').encode('utf-8', 'ignore')
        use_db = False

        # Open the datasource
        datasource = ogr.Open(file)
        if not datasource:
            datasource = ogr.Open(file + '.shp')
            if not datasource:
                use_db = True
                datasource = ogr.Open("PG: " + connection)
                if not datasource:
                    response['errors'].append("No shapefile found for " + file)
                    return response

        if use_db:
            regex_result = re.search('(.*)\sfrom\s\((.*)\)', original_datasource, flags=re.IGNORECASE)
            try:
                layer = datasource.ExecuteSQL(regex_result.group(2))
            except AttributeError:
                response['errors'].append('Invalid query')
                return response
        else:
            layer = datasource.GetLayer()

        layer_defn = layer.GetLayerDefn()
        response['fields'] = [layer_defn.GetFieldDefn(i).GetName() for i in range(layer_defn.GetFieldCount())]
        response['status'] = 1
        return response

    @view_config(
        route_name='classify.field.getdata',
        permission='view',
        renderer='json',
        request_method='POST'
    )
    def get_data(self):
        response = {
            'status': 0,
            'errors': [],
            'geom_type': '',
            'minimum': None,
            'maximum': None,
            'nb_values': None,
            'unique_values': None,
            'data_dict': None
            }

        file = (self.request.registry.settings.get('workspaces.directory', '')
            + '/' + self.request.POST.get('datasource'))
        connection = self.request.POST.get('connection')
        use_db = False
        field = self.request.POST.get('field').encode('utf-8', 'ignore')
        original_datasource = self.request.POST.get('original_datasource').encode('utf-8', 'ignore')

        try:
            field = self.request.POST.get('field').encode('utf-8', 'ignore')
        except AttributeError:
            response['errors'].append('Invalid field')
            return response

        # Open the datasource
        datasource = ogr.Open(file)
        if not datasource:
            datasource = ogr.Open(file + '.shp')
            if not datasource:
                datasource = ogr.Open("PG: " + connection)
                use_db = True
                if not datasource:
                    response['errors'].append("No shapefile found for " + file)
                    return response

        if use_db:
            regex_result = re.search('(.*)\sfrom\s\((.*)\)', original_datasource, flags=re.IGNORECASE)
            try:
                layer = datasource.ExecuteSQL(regex_result.group(2))
            except AttributeError:
                response['errors'].append('Invalid query')
                return response
        else:
            layer = datasource.GetLayer()

        layer_defn = layer.GetLayerDefn()
        field_index = layer_defn.GetFieldIndex(field)

        if field_index == -1:
            response['errors'].append('Field "' + field + '" not found')
            return response

        field_defn = layer_defn.GetFieldDefn(field_index)

        try:
            response['geom_type'] = field_defn.GetTypeName()
        except AttributeError:
            response['errors'].append('Invalid field')
            return response

        values = list()
        layer.ResetReading()
        nb_features = layer.GetFeatureCount()
        for i in range(nb_features):
            feature = layer.GetNextFeature()
            field_value = feature.GetField(field)
            if type(field_value) is str:
                field_value = field_value.decode('utf-8', 'ignore')
            values.append(field_value)

        response['nb_values'] = i+1

        max_values = 2000
        if response['geom_type'] in ['Real', 'Integer']:
            max_values = 10000000
            response['maximum'] = max(values)
            response['minimum'] = min(values)

        counter=collections.Counter(values)
        response['data_dict'] = counter

        unique_values = len(counter.keys())

        if unique_values > max_values:
            response['data_dict'] = None
            response['errors'].append('Too many different values: ' + str(unique_values))
            return response

        response['unique_values'] = unique_values



        response['status'] = 1

        return response
