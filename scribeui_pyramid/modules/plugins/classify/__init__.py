def includeme(config):
    config.add_static_view(name='classify', path='static')
    config.scan('.')

def getIncludedFiles():
    return {'css': ['classify/css/classify.css'],
            'js': ['classify/js/classify.js']}
