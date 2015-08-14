from pyramid.view import view_config
from osgeo import ogr
from sets import Set
import collections
import re

class ClassifyView(object):
    def __init__(self, request):
        self.request = request
        self.datasource = None

    # Read a layer from a file or a connection
    def get_layer(self, file, connection, original_datasource):
        response = {
            'layer': None,
            'errors': []
        }

        use_db = False
        layer = None

        # Open the datasource as a file, as is
        self.datasource = ogr.Open(file)
        if not self.datasource:
            # Open failed, try again by appending .shp to the file name
            self.datasource = ogr.Open(file + '.shp')
            if not self.datasource:
                # Open failed, try to open a connection instead
                use_db = True
                self.datasource = ogr.Open("PG: " + connection)
                if not self.datasource:
                    # No valid shapefile, no valid connection
                    response['errors'].append("No shapefile found for " + file)
                    return response

        if use_db:
            # Additional steps to get the layer from the database
            query = ''

            # First, try the structure 'geometry from (SELECT column FROM table)'
            regex_result = re.search('(.*)\sfrom\s\((.*)\)', original_datasource, flags=re.IGNORECASE)
            if regex_result is None:
                # If not found, try 'geometry from TABLE'
                regex_result = re.search('\s*(.*\sfrom\s[^\s]+)', original_datasource, flags=re.IGNORECASE)
                if regex_result is None:
                    # Not a known form of data query
                    response['errors'].append('Could not interpret the query')
                    return response
                else:
                    query = 'SELECT ' + regex_result.group(1)
            else:
                query = regex_result.group(2)

            # Execute the query to get the layer
            try:
                layer = self.datasource.ExecuteSQL(query)
            except AttributeError:
                response['errors'].append('Invalid query')
                return response
        else:
            layer = self.datasource.GetLayer()

        response['layer'] = layer
        return response

    # This view returns all fields of a table or shapefile
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

        layer_result = self.get_layer(file, connection, original_datasource)
        if len(layer_result['errors']) > 0:
            response['errors'].extend(layer_result['errors'])
            return response

        layer = layer_result['layer']
        layer_defn = layer.GetLayerDefn()

        if layer_defn.GetFieldCount() == 0:
            response['errors'].append('No valid fields found for this table')
            return response

        response['fields'] = [layer_defn.GetFieldDefn(i).GetName() for i in range(layer_defn.GetFieldCount())]

        response['status'] = 1
        return response

    # This view returns all the data for a field in a table or file
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
        layer_result = self.get_layer(file, connection, original_datasource)
        if len(layer_result['errors']) > 0:
            response['errors'].extend(layer_result['errors'])
            return response

        layer = layer_result['layer']
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

        # Placing the values in a counter allows storing the same values only once while keeping the amount of copies
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
