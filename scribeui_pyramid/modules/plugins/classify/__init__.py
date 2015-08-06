def routes_plugins(config):
    config.add_route('classify.field.getlist', '/classify/field/getlist')
    config.add_route('classify.field.getinfo', '/classify/field/getinfo')
    config.add_route('classify.field.getdata', '/classify/field/getdata')

def includeme(config):
    config.add_static_view(name='classify', path='static')
    config.scan('.')
    config.include(routes_plugins, route_prefix='api')

def getIncludedFiles():
    return {'css': ['classify/css/colorMenu.css',
                    'classify/css/classify.css'],
            'js':  ['classify/lib/TinyColor/tinycolor.js',
                    'classify/js/colorMenu.js',
                    'classify/js/classify.js']}
