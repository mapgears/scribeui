# -*- coding: utf-8 -*-
from wtforms import (
    Form,
    TextField,
    PasswordField,
    validators
)


class LoginForm(Form):
    name = TextField(
        u'Workspace',
        [validators.Required(message=u'Please select a workspace.')]
    )
    password = PasswordField(
        u'Password'
    )
