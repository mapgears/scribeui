def includeme(config):
    config.add_static_view(name='setextent', path='static')
    config.scan('.')

def getIncludedFiles():
    return {'css':'setextent/css/setextent.css',
            'js': 'setextent/js/setExtent.js'}

