from flask import Flask, Blueprint, request, session, render_template, jsonify, g
from jinja2 import TemplateNotFound

plugin = Blueprint('setExtent', __name__, static_folder='static')

def test():
    return "TEST"
