from flask import Flask, Blueprint, render_template, url_for, current_app, request, g
import simplejson, pprint, sys
sys.path.append("../../") # Gives access to init.py functions

plugin = Blueprint('mapcache', __name__, static_folder='static', template_folder='templates')

def getJsFiles():
    return url_for('mapcache.static',filename='js/mapcache.js')

def getCssFiles():
    return url_for('mapcache.static',filename='css/mapcache.css')

@plugin.route('/startjob', methods=['GET'])
def startJob():
	from init import get_map_id # Cannot be imported at beginning of file because of circular import
	
	workspaceName = request.args.get("ws",'')
	mapName = request.args.get("map",'')
	mapEntry = get_map_id(mapName, workspaceName)
	if mapEntry is not None:
		return "Job started for "+mapName
	else:
		return "ERROR: "+mapName+" map is unavailable or does not exist"

# Creates the table if it doesn't exist
#def createTable():
