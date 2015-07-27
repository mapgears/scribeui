from pyramid.view import view_config

class ClassifyView(object):
    def __init__(self, request):
        self.request = request

    @view_config(
        route_name='helloworld',
        permission='view'
    )
    def helloworld(self):
        return "HELLO"
