from flask import Flask, Blueprint, request, session, render_template, jsonify, g
from jinja2 import TemplateNotFound

setExtent = Blueprint('setExtent', __name__, static_folder='static')
