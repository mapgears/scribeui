from flask import Flask, Blueprint, request, session, render_template, jsonify, g, url_for, current_app
from jinja2 import TemplateNotFound

plugin = Blueprint('setextent', __name__, static_folder='static')

@plugin.route('/test')
def test():
    return "TEST"

def getJsFiles():
    return url_for('setextent.static',filename='js/setExtent.js')

def getCssFiles():
    return url_for('setextent.static',filename='css/setextent.css')
