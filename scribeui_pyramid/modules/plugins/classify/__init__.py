def routes_plugins(config):
    config.add_route('classify.attributes.get', '/classify/attributes/get')

def includeme(config):
    config.add_static_view(name='classify', path='static')
    config.scan('.')
    config.include(routes_plugins, route_prefix='api')

def getIncludedFiles():
    return {'css': ['classify/css/classify.css'],
            'js': ['classify/js/classify.js']}
