from flask import Flask, Blueprint, request, session, render_template, jsonify, g, url_for, current_app
from jinja2 import TemplateNotFound

plugin = Blueprint('setextent', __name__, static_folder='static')

#Anything specified in the app's routes will appear as pluginname/your-route
#In this case, the path will be plugins/setextent/test
@plugin.route('/test')
def test():
    return "TEST"

#Specify here any javascript files you wish to be included in the index page.
def getJsFiles():
    return url_for('setextent.static',filename='js/setExtent.js')

#Specify here any CSS files you wish to be included in the index page.
def getCssFiles():
    return url_for('setextent.static',filename='css/setextent.css')
