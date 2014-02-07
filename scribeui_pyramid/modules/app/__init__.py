

def includeme(config):
    config.add_request_method(
        'pyramid.security.authenticated_userid',
        'userid',
        property=True,
        reify=True
    )
    config.include('.sqla')
    config.include('.navbar')
    config.scan('.')


class Error(Exception):
    """Base class for exceptions in scribeui_pyramid."""
    pass


class ValidationError(Error):
    """Exception raised for validation errors."""
    pass
