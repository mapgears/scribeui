# -*- coding: utf-8 -*-
from wtforms import (
    Form,
    TextField,
    PasswordField,
    validators
)
from wtforms.validators import ValidationError

from .models import Workspace


class EncryptedPasswordField(PasswordField):
    """Encrypt password after validation"""
    def post_validate(self, form, validation_stopped):
        self.data = Workspace.encode_password(self.data)


class WorkspaceForm(Form):
    name = TextField(
        u"name",
        [validators.Required(message=u'Please enter a workspace name.')]
    )
    email = TextField(
        u'Email', [
            validators.Required(message=u'Please enter an email address.'),
            validators.Email(message=u'Invalid email address.')
        ]
    )

    def validate_workspacename(self, field):
        value = field.data
        exists = Workspace().by_name(value)
        current_id = int(self.extras.request.matchdict.get('id', 0))
        if exists and exists.id != current_id:
            raise ValidationError(u'This workspace name exists already.')


class PasswordForm(Form):
    password = EncryptedPasswordField(
        u'Password',
        [validators.Required(message=u'Please enter a password.'),
         validators.EqualTo('confirm',
                            message=u'Passwords must match.')]
    )
    confirm = PasswordField('Repeat Password')


class NewWorkspaceForm(WorkspaceForm):
    password = EncryptedPasswordField(
        u'Password',
        [validators.Required(message=u'Please enter a password.'),
         validators.EqualTo('confirm',
                            message=u'Passwords must match.')]
    )
    confirm = PasswordField('Repeat password')
