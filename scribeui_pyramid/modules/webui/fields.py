# -*- coding: utf-8 -*-
import datetime

from wtforms import (
    IntegerField,
    FloatField,
    DateTimeField
)

class IntegerFieldFr(IntegerField):
    def process_formdata(self, valuelist):
        if valuelist:
            try:
                self.data = int(valuelist[0])
            except ValueError:
                self.data = None
                raise ValueError(self.gettext(u'La valeur entrée doit être un nombre entier.'))
                
class FloatFieldFr(FloatField):
    def process_formdata(self, valuelist):
        if valuelist:
            try:
                self.data = float(valuelist[0])
            except ValueError:
                self.data = None
                raise ValueError(self.gettext(u'La valeur entrée doit être un nombre.'))

class DateTimeFieldFr(DateTimeField):
    def process_formdata(self, valuelist):
        if valuelist:
            date_str = ' '.join(valuelist)
            try:
                self.data = datetime.datetime.strptime(date_str, self.format)
            except ValueError:
                self.data = None
                raise ValueError(self.gettext(u'La valeur entrée n\'est pas une date valide.'))
