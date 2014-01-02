# all the imports 
from flask import Flask, request, session, render_template, jsonify, g
import os, sys
import sqlite3 #Database 
from contextlib import closing #Database
import re #regular expression
from werkzeug import check_password_hash, generate_password_hash, secure_filename
import subprocess
import json #commit
import codecs #Opening group files
#import zipfile #download
#from os.path import join #download
import random # download
import datetime #download
import pprint #For debugging purposes
import imp #For plugins
import traceback #output exceptions to apache's log. Mostly helpful for plugin development.
import string

#Get path of the application                            
path = os.path.abspath(os.path.dirname(__file__))+"/"
os.chdir(path)

#Import config
sys.path.append(path+"../")
from config import *

#Declaration of the application
app = Flask(__name__)
app.config.from_object(__name__)

#Config de l'application 
app.config.update(
    DEBUG=True,
    DATABASE = path+'db/database.db',
    SECRET_KEY = 'development key',
    USERNAME = 'admin',
    PASSWORD = 'default',
    #PERMANENT_SESSION_LIFETIME = 3600
)

#List of files in map
listfiles = [{'name':'scales','url':'editor/scales'},
             {'name':'variables','url':'editor/variables'},
             {'name':'map','url':'editor/map'},
             {'name':'projections','url':'epsg'}, 
             {'name':'fonts','url':'fonts.lst'},
             {'name':'symbols','url':'symbols.map'},
             ]

listfilesBasemaps = [{'name':'scales','url':'Makefile'},
                    {'name':'variables','url':'generate_style.py'},
                    {'name':'map','url':'osmbase.map'},
                    {'name':'projections','url':'epsg'},
                    {'name':'fonts','url':'fonts.lst'},
                    {'name':'symbols','url':'symbol.map'},
                    ]

listfilesStandard = [{'name':'scales','url':'scales'},
                    {'name':'projections','url':'epsg'},
                    {'name':'fonts','url':'fonts.lst'},
                    {'name':'symbols','url':'symbols.map'},
                    ]
plugins = {}

#	Plugin load code
#===============================
def load_plugins():
    path = "plugins/"
    for filename in os.listdir(path):
        if os.path.isdir(path+filename) and os.path.isfile(path+filename+'/__init__.py'):
            try:
                f, pluginName, descr = imp.find_module(filename, [path])
                plugins[pluginName] =  imp.load_module(filename, f, pluginName, descr)
                app.register_blueprint(getattr(plugins[pluginName], 'plugin'), url_prefix='/'+pluginName)
            except ImportError:
                pprint.pprint('There was an error with the '+filename+' plugin:')
                traceback.print_exc(file=sys.stdout)
                
    return "1"
load_plugins()

#===============================
#        DATABASE
#===============================
#DB connection                                                  
def connect_db():
    return sqlite3.connect(app.config['DATABASE'])

#Initialization of the database                                         
def init_db():
    with closing(connect_db()) as db:
        with app.open_resource('schema.sql') as f:
            db.cursor().executescript(f.read())
        db.commit()

#Get the ID of the workspace from its name
def get_ws_id(ws_name):
    rv = g.db.execute('select ws_id from workspaces where ws_name = ?',
                       [ws_name]).fetchone()
    return rv[0] if rv else None


#Get the ID of the map from its name and the name of its workspace    
def get_map_id(map_name, ws_name):
    rv = g.db.execute('select map_id from maps where map_name = ? and ws_id = ?',
                             [map_name, get_ws_id(ws_name)]).fetchone()
    return rv[0] if rv else None

#Query the DB      
def query_db(query, args=(), one=False):
    cur = g.db.execute(query, args)
    rv = [dict((cur.description[idx][0], value)
               for idx, value in enumerate(row)) for row in cur.fetchall()]
    return (rv[0] if rv else None) if one else rv

#Initialize the database connection before request
@app.before_request
def before_request():
    g.db = connect_db()

#Close the database connection after request and catch exceptions
@app.teardown_request
def teardown_request(exception):
    g.db.close()
#===============================
#   Utilities
#===============================
def generate_dummy_password(length):
    s = string.lowercase + string.digits
    dummy = ''.join(random.sample(s, length))           
    return dummy

#===============================   
#          Homepage                              
#===============================
#Homepage of the application
@app.route('/')
def index():
    plugins_js = []
    plugins_css = []
    dir_to_search = path+"www/"
    for dirpath, dirnames, filenames in os.walk(dir_to_search):
        for file in filenames:
            if (re.search(".zip$",file) is not None): 
                curpath = os.path.join(dirpath, file)
                file_modified = datetime.datetime.fromtimestamp(os.path.getmtime(curpath))
                if datetime.datetime.now() - file_modified > datetime.timedelta(hours=1):
                    os.remove(curpath)
    for name in plugins:
        try:
            js_files = plugins[name].getJsFiles()
            if isinstance(js_files, str):
                plugins_js.append(js_files)
            else:
                for js in js_files:
                    plugins_js.append(js)
        except AttributeError:
            #If the plugins doesn't have js files to include, ignore it. 
            pass
        try:
            css_files = plugins[name].getCssFiles()
            if isinstance(css_files, str):
                plugins_css.append(css_files)
            else:
                for css in css_files:
                    plugins_css.append(css)
        except AttributeError:
            pass
    return render_template('index.html', plugins_js=plugins_js, plugins_css=plugins_css)

#===============================
#          Workspace   
#===============================
#Create a new workspace                           
@app.route('/_create_new_ws', methods=['POST'])
def create_new_ws():
    name = request.form['name']
    expression = r"^[A-Za-z0-9][A-Za-z0-9_-]{1,99}$"
    if (re.search(expression, name) is None):
        return "Invalid name"
    if (get_ws_id(name) is not None) or (name=="templates"):
        return "Existing"
    g.db.execute('insert into workspaces (ws_name, password) values (?, ?)',
                 [name, generate_password_hash(request.form['password'])])
    g.db.commit()
    session['ws_name'] = name
    session.pop('map_name', None)
    session.permanent = True
    subprocess.call(['mkdir',path+'workspaces/'+ name])                

    #Add POI in database
    pois = query_db('''select * from pois where ws_id = ?''', ['0'], one=False)
    for j in range(len(pois)):
        g.db.execute('insert into pois(poi_name, latitude, longitude, scalelvl, ws_id) values (?,?,?,?,?)', [pois[j]['poi_name'], pois[j]['latitude'],pois[j]['longitude'],pois[j]['scalelvl'], get_ws_id(session['ws_name'])])
    g.db.commit()

    return "1"

#Return the list of workspaces         
@app.route('/_get_ws', methods=['POST'])
def get_ws():
    ws = query_db("select ws_name from workspaces", one=False)
    workspaces = {}
    for i in range(len(ws)):
        workspaces[i] = ws[i]['ws_name']
    return jsonify(workspaces)

#Open an existing workspace                                      
@app.route('/_open_ws', methods=['POST'])
def open_ws():
    error = None
    if request.method == 'POST':
        ws = query_db('''select * from workspaces where ws_name = ?''', [request.form['name']], one=True)
        if ws is None:
            error = 'Invalid workspace'
        elif not check_password_hash(ws['password'], request.form['password']):
            error = 'Invalid password'
        else:
            session['ws_name'] = ws['ws_name']
            session.pop('map_name', None)
            session.permanent = True
            return get_maps()
    return error

#Delete workspace
@app.route('/_delete_ws', methods=['POST'])
def delete_ws():
    wsToDelete = request.form['name']
    error = "1"
    ws = query_db('''select * from workspaces where ws_name = ?''', [wsToDelete], one=True)  
    if ws is None:
        error = 'Invalid workspace'
    elif not check_password_hash(ws['password'], request.form['password']):
        error = 'Invalid password '
        
    else:
        wsmap = query_db('''select * from maps where ws_id = ?''', [ws['ws_id']], one=False)
        for i in range(len(wsmap)): 
            g.db.execute('''DELETE FROM groups WHERE map_id=?''', [wsmap[i]['map_id']])
            connectorFile = "/usr/lib/cgi-bin/elfinder-python/connector-"+wsToDelete+"-"+wsmap[i]['map_name']+".py"
            subprocess.call(['rm','-f',connectorFile])
        g.db.execute('''DELETE FROM maps WHERE ws_id=?''', [ws['ws_id']])
        g.db.execute('''DELETE FROM pois WHERE ws_id=?''', [ws['ws_id']])
        g.db.execute('''DELETE FROM workspaces WHERE ws_id=?''', [ws['ws_id']])
        g.db.commit()
 
        subprocess.call(['rm','-r', path+"workspaces/"+ws['ws_name']])

        session.pop('ws_name', None)
        session.pop('map_name', None)
    return error

#===============================
#          Maps 
#=============================== 
#Create a new map from a template        
@app.route('/_create_map', methods=['POST'])
def create_map():
    name = request.form['name']
    maptype = request.form['type'] #Scribe - Basemaps - Standard
    template = request.form['template']
    description = request.form['description']
    ws_template = request.form['templatelocation']
   
    expressionTemplate = r"^[*][A-Za-z0-9_-]{1,99}$"
    if (ws_template == "") and (re.search(expressionTemplate, template) is None):
        ws_template = session['ws_name']
    elif (ws_template == ""):
        ws_template = "templates"

    if (ws_template != session['ws_name']) and (ws_template != "templates"):
        ws_temp = query_db('''select * from workspaces where ws_name = ?''', [ws_template], one=True)
        if not check_password_hash(ws_temp['password'], request.form['locationpassword']):
            return 'Invalid password'

    expression = r"^[A-Za-z0-9][A-Za-z0-9_-]{1,99}$"
    if (re.search(expression, name) is None) or (name=="OSM - MapQuest") or (name=="OSM - Standard"):
        return "Invalid name"

    #check if the map name is unique for this workspace   
    wsmap = query_db("select map_name from maps where ws_id = ?", [get_ws_id(session['ws_name'])], one=False)
    for i in range(len(wsmap)):
        if name == wsmap[i]['map_name']:
            return "Existing"

    #Add the map in the bd      
    g.db.execute('insert into maps (map_name, map_type, map_desc, ws_id) values (?, ?, ?, ?)',
                 [name, maptype, description, get_ws_id(session['ws_name'])])
    g.db.commit()

    #Copy the template directory to the directory of the new map    
    if ws_template == "templates":
        if template != '*Dummy':
            map_cur = (query_db('''select map_id from maps where map_name = ? and ws_id = "0"''',[template], one=True))['map_id']
        else:
            map_cur = None
        template = template[1:]
        pathTemplate = path+"workspaces/templates/"+template
    else:
        pathTemplate = path+"workspaces/"+ws_template+"/"+template
        map_cur = get_map_id(template, ws_template)

    pathMap = path+"workspaces/"+session['ws_name']+"/"+name
    subprocess.call(['cp','-R', pathTemplate, pathMap])
    if maptype == 'Scribe' or maptype == 'Standard':
        subprocess.call(['mv', pathMap+"/map/"+template+".map", pathMap+"/map/"+name+".map"])           
    elif maptype == 'Basemaps':
        subprocess.call(['mv', pathMap+"/osm-"+template+".map", pathMap+"/osm-"+name+".map"])
        #Change the map name in the Makefile           
        source = open(pathMap+"/Makefile","r" )
        contentS=source.read()
        source.close()
        contentD=contentS.replace("OUTPUT="+template,"OUTPUT="+name )
        destination = open(pathMap+"/Makefile","w" )
        destination.write(contentD)
        destination.close()

    
    #Add layers in the bd
    if map_cur:
        groups = query_db('''select * from groups where map_id = ?''', [map_cur], one=False)
        for j in range(len(groups)):
            g.db.execute('insert into groups (group_name, group_index, map_id) values (?,?,?)', [groups[j]['group_name'], groups[j]['group_index'], get_map_id(name, session['ws_name'])])
        g.db.commit()

    return "1"


#Return a list of maps of the workspace           
@app.route('/_get_maps',methods=['POST'])
def get_maps():
    wsmap = query_db('''select * from maps where ws_id = ?''', [get_ws_id(session['ws_name'])], one=False)

    listmaps = {}
    listmaps["maps"] = []
    for i in range(len(wsmap)):
        maps = {}
        maps["name"] = wsmap[i]['map_name']
        maps["type"] = wsmap[i]['map_type']
        if maps["type"] == "Basemaps":
            maps["url"] = "http://" + ip + "/cgi-bin/mapserv?map=" + path + "workspaces/" + session['ws_name'] + "/" + wsmap[i]['map_name'] +  "/osm-" + wsmap[i]['map_name'] +".map"
        else:
            maps["url"] = "http://" + ip + "/cgi-bin/mapserv?map=" + path + "workspaces/" + session['ws_name'] + "/" + wsmap[i]['map_name'] +  "/map/" + wsmap[i]['map_name'] +".map"
        maps["description"] = wsmap[i]['map_desc']
        listmaps["maps"].append(maps)

    return jsonify(**listmaps)

#Open map    
@app.route('/_open_map',methods=['POST'])
def open_map():
    error = '';
    namemap = request.form['name']
    wsmap = query_db('''select * from maps where ws_id = ? and map_name = ?''', [get_ws_id(session['ws_name']), namemap], one=True)
    pathMap = path + "workspaces/" + session['ws_name'] + "/" + namemap + "/"

    contentfiles = {}
    contentfiles['name'] = namemap
    contentfiles['type'] = wsmap['map_type']
    
    if wsmap['map_type'] == 'Scribe':
        pathGroups = pathMap + "editor/"
        contentfiles["url"] = "http://" + ip + "/cgi-bin/mapserv?map=" + pathMap + "map/" + namemap +".map"
        for i in range(len(listfiles)):
            document = open(pathMap + listfiles[i]['url'], "r")
            contentfiles[listfiles[i]['name']] = document.read()
            document.close()
    elif wsmap['map_type'] == 'Basemaps':
        pathGroups = pathMap
        contentfiles["url"] = "http://" + ip + "/cgi-bin/mapserv?map=" + pathMap + "osm-" + namemap +".map"
        for i in range(len(listfilesBasemaps)):
            document = open(pathMap + listfilesBasemaps[i]['url'], "r")
            contentfiles[listfilesBasemaps[i]['name']] = document.read()
            document.close()
    elif wsmap['map_type'] == 'Standard':
        pathGroups = pathMap + "map/layers/"
        contentfiles["url"] = "http://" + ip + "/cgi-bin/mapserv?map=" + pathMap + "map/" + namemap +".map"
        for i in range(len(listfilesStandard)):
            document = open(pathMap + listfilesStandard[i]['url'], "r")
            contentfiles[listfilesStandard[i]['name']] = document.read()
            document.close()
        document = open(pathMap + "map/" + namemap + ".map", "r")
        contentfiles['map'] = document.read()
        document.close()

    contentfiles['groups'] = []
    if wsmap['map_type'] == 'Scribe':
        # Read groups from config file instead of the BD
        groupFiles = getGroupFiles(pathMap, pathGroups)

	for i in range(0, len(groupFiles)):
            if (os.path.isfile(groupFiles[i])):
                unGroup = {}
                unGroup["name"] = getGroupNameFromFile(groupFiles[i])
                document = open(groupFiles[i], "r")
                unGroup["content"] = document.read()
                document.close()
                contentfiles["groups"].append(unGroup)
    else:
        groups = query_db('''select group_name, group_index from groups where map_id = ?''', [wsmap['map_id']], one=False)
        groups = sorted(groups)
        for j in range(len(groups)):
            unGroup = {}
            unGroup["name"] = groups[j]['group_name']
            document = open(pathGroups + unGroup["name"], "r")
            unGroup["content"] = document.read()
            document.close()
            contentfiles["groups"].append(unGroup)


    #Parameters map
    contentfiles['errorMsg']=[]
    if wsmap['map_type'] == 'Scribe':
        try:
            mapfile = open(pathMap+"editor/map")
            mapdata = mapfile.readlines()
            scalefile = open(pathMap+"editor/scales")
            scaledata = json.loads(string2json(scalefile.read()))
            contentfiles['OLExtent'] = "NULL"
            contentfiles['OLUnits'] = "NULL"
            contentfiles['OLScales'] = "NULL"
            contentfiles['OLProjection'] = "NULL"
            projectionFound = False
            for l in mapdata:
                line = l.strip()
                if projectionFound:
                    if line.find('init='):
                        contentfiles['OLProjection'] = line[6:-1].strip()
                    else:
                        contentfiles['OLProjection'] = line[1:-1].strip()
                    projectionFound = False
                index = line.find('EXTENT:')
                if index != -1:
                    contentfiles['OLExtent'] = line[index+7:].strip()
                index = line.find('UNITS:')
                if index != -1:
                    contentfiles['OLUnits'] = line[index+6:].strip()
                index = line.find('PROJECTION')
                if index != -1:
                    projectionFound = True
            mapfile.close();
            mapfile.close();
            scalefile.close();
        except:
            contentfiles['errorMsg'].append("The header is bad")
        try:
            contentfiles['OLScales']=list2dict(scaledata['SCALES'])
        except:
            contentfiles['OLScales'] = "NULL"
            contentfiles['errorMsg'].append("SCALES not found")
 

    elif wsmap['map_type'] == 'Basemaps':
        stringSearch = ["OSM_EXTENT", "OSM_UNITS", "OSM_SRID"]
        makefile = open(pathMap + "Makefile", "r")
        for line in makefile:
            for string in stringSearch:
                if string in line:
                    if re.search('^OSM_EXTENT',line):
                        contentfiles['OLExtent'] = line.split('=')[1].split('\n')[0]
                    if re.search('^OSM_UNITS',line):
                        contentfiles['OLUnits'] = line.split('=')[1].split('\n')[0]
                    if re.search('^OSM_SRID',line):
                        contentfiles['OLProjection'] = 'epsg:' + line.split('=')[1].split('\n')[0]
        makefile.close()
        scalefile = open(pathMap + "generate_style.py", "r")
        content = scalefile.read().split('minscales = {\n')[1].split('\n}')[0].split(',\n')
        scales = {}
        i = 0
        for scale in content:
            scales[i] = scale.split(':')[1]
            i = i + 1
        contentfiles['OLScales'] = scales
        scalefile.close()
    elif wsmap['map_type'] == 'Standard':
        contentfiles['variables'] = ""
        stringSearch = ["init=", "UNITS", "EXTENT", "LAYER"]
        mapfile = open(pathMap + "map/" + namemap  + ".map", "r")
        contentfiles['OLUnits'] = ''
        stop = 0
        for line in mapfile:
            if stop == 0:
                for string in stringSearch:
                    if string in line:
                        if re.search('^[\s]{0,}EXTENT',line):
                            contentfiles['OLExtent'] = line.split('EXTENT ')[1].split('\n')[0]
                        if re.search('^[\s]{0,}UNITS',line) and contentfiles['OLUnits'] == '':
                            contentfiles['OLUnits'] = line.split('UNITS ')[1].split('\n')[0]
                        if re.search('^[\s]{0,}"init=',line):
                            contentfiles['OLProjection'] = line.split('init=')[1].split('"')[0]
                        if re.search('^[\s]{0,}LAYER',line):
                            stop = 1
                            break
        mapfile.close()
        scalefile = open(pathMap + "scales", "r")
        content = scalefile.read().split('{')[1].split('}')[0].split(',')
        scales = {}
        i = 0
        for scale in content:
            scales[i] = scale.split(':')[1].split('\n')[0]
            i = i + 1
        contentfiles['OLScales'] = scales
        scalefile.close()

    session['map_name'] = wsmap["map_name"]

    #Change path for data browser (/usr/lib/cgi-bin/elfinder-python/connector.py)
    connectorPath = "/usr/lib/cgi-bin/elfinder-python/"
    connectorFile = connectorPath+"connector-"+session['ws_name']+"-"+session['map_name']+".py"
    if not os.path.isfile(connectorFile):
        source = open(connectorPath+"connector.py", "r")
        contentS = source.read()
        source.close()
        contentD = contentS.replace("MAPURL",pathMap)
        destination = open(connectorFile, "w")
        destination.write(contentD)
        destination.close()
        subprocess.call(['chmod','+x', connectorFile])

    return jsonify(**contentfiles)

#List to dict
def list2dict(ls):
    dc = {}
    for item in ls:
        for key in item:
            dc[key] = item[key]
    return dc

#Delete map
@app.route('/_delete_map',methods=['POST'])
def delete_map():
    mapToDelete = request.form['name']

    map_id = get_map_id(mapToDelete, session['ws_name'])
    g.db.execute('''DELETE FROM groups WHERE map_id=?''', [map_id])
    g.db.execute('''DELETE FROM maps WHERE map_id=?''', [map_id])
    g.db.commit()

    subprocess.call(['rm','-r', path+"workspaces/"+session['ws_name']+"/"+mapToDelete])

    connectorFile = "/usr/lib/cgi-bin/elfinder-python/connector-"+session['ws_name']+"-"+mapToDelete+".py"
    if os.path.isfile(connectorFile):
        subprocess.call(['rm',connectorFile])
    if 'map_name' in session and mapToDelete == session['map_name']:
         session.pop('map_name', None)
    return "1"

#===============================  
#           Template
#=============================== 
#Return the list of templates
@app.route('/_get_templates', methods=['POST'])
def get_templates():
    templateType = request.form['type']
    try:
        ws_name = request.form['ws_name']
        if ws_name == 'templates':
           ws_id = '0';
        elif ws_name == '' or ws_name == 'null':
            ws_id = get_ws_id(session['ws_name'])
        else:
            ws_id = get_ws_id(ws_name)
    except:
        ws_id = get_ws_id(session['ws_name'])
        
    wsmap = query_db('''select map_name from maps where ws_id = ? and map_type = ?''', [ws_id, templateType], one=False)
    templates = {}
    for i in range(len(wsmap)): 
        templates[i] = wsmap[i]['map_name']
    return jsonify(templates)

#===============================  
#           Groups
#=============================== 
#Add Group
@app.route('/_add_group', methods=['POST'])
def add_layer():
    if 'ws_name' in session and 'map_name' in session:
        groupname = request.form['name'] 
        pathMap = path + "workspaces/" + session['ws_name'] + "/" + session['map_name'] + "/"

        expression = r"^[A-Za-z0-9][A-Za-z0-9_.]{1,99}$"
        if (re.search(expression, groupname) is None):
            return "Invalid name"
                         
        mapid = get_map_id(session['map_name'],session['ws_name'])
        wsmap = query_db('''select map_type from maps where map_id = ?''', [mapid], one=True)

    	if wsmap['map_type'] == 'Scribe':
            pathGroup = path+"workspaces/"+session['ws_name']+"/"+session['map_name']+"/editor/groups/"#+groupname+".layer" 
            groupsFiles = getGroupFiles(pathMap, pathGroup)
	    for gr in groupsFiles:
                name = getGroupNameFromFile(gr)
                if groupname == name:
                    return "Existing"

            inputConfigFile = codecs.open(pathMap + 'config', encoding='utf8')
            inputConfigContent = inputConfigFile.read()
            inputConfigFile.close()

            jsonConfig = json.loads(string2json(inputConfigContent))
            jsonConfig['ORDER'].append({str(len(jsonConfig['ORDER'])+1):'groups/'+groupname+'.layer'})
            with open(pathMap+'config', 'w+') as f:
                f.write("ORDER {\n")
                for i in range(len(jsonConfig['ORDER'])):
                    key, value = jsonConfig['ORDER'][i].popitem()
                    f.write(" "+key+": "+value+" \n")
                f.write("}")
            file(pathGroup+groupname+'.layer', 'w+')
	else:
            groups = query_db("select group_name, group_index from groups where map_id = ?", [mapid], one=False)
            if groups:
                groups = sorted(groups)
                maxindex = groups[-1]['group_index']
            else:
                maxindex = 0  
            if not ".map" in groupname:
                groupname = groupname+".map"
            for i in range(len(groups)):
                if groupname == groups[i]['group_name']:
                    return "Existing"
                                                    
            g.db.execute('insert into groups (group_name, group_index, map_id) values (?,?,?)',[groupname, maxindex+1, mapid])
            g.db.commit()
        
            if wsmap['map_type'] == 'Basemaps':
                pathGroup = path+"workspaces/"+session['ws_name']+"/"+session['map_name']+"/"+groupname
            elif wsmap['map_type'] == 'Standard':
                pathGroup = path+"workspaces/"+session['ws_name']+"/"+session['map_name']+"/map/layers/"+groupname
            file(pathGroup, 'w+')
    return "1"

#Remove Group
@app.route('/_remove_group', methods=['POST'])
def remove_group():
    if 'ws_name' in session and 'map_name' in session:
        pathMap = path+"workspaces/"+session['ws_name']+"/"+session["map_name"]+"/"
        groupname = request.form['name']

        mapid = get_map_id(session['map_name'],session['ws_name'])
        wsmap = query_db('''select map_type from maps where map_id = ?''', [mapid], one=True)

        if wsmap['map_type'] == 'Scribe':
            pathGroup = path+"workspaces/"+session['ws_name']+"/"+session['map_name']+"/editor/groups/"#+groupname+".layer" 
            groupsFiles = getGroupFiles(pathMap, pathGroup)

            inputConfigFile = codecs.open(pathMap + 'config', encoding='utf8')
            inputConfigContent = inputConfigFile.read()
            inputConfigFile.close()

            jsonConfig = json.loads(string2json(inputConfigContent))
            with open(pathMap+'config', 'w+') as f:
                f.write("ORDER {\n")
                found = False
                for i in range(len(jsonConfig['ORDER'])):
                    key, value = jsonConfig['ORDER'][i].popitem()
                    if groupname in value:
                        found = True
                        continue
                    if found:
                        key = int(key)-1
                    f.write("    "+str(key)+": "+value+" \n")
                f.write("}")
            pathGroup = pathGroup+groupname+'.layer'
        else:
            g.db.execute("DELETE from groups where map_id = ? and group_name = ?", [mapid, groupname])
            g.db.commit()

            if wsmap['map_type'] == 'Basemaps':
                pathGroup = path+"workspaces/"+session['ws_name']+"/"+session['map_name']+"/"+groupname
            elif wsmap['map_type'] == 'Standard':
                pathGroup = path+"workspaces/"+session['ws_name']+"/"+session['map_name']+"/map/layers/"+groupname
        if os.path.isfile(pathGroup) :
            subprocess.call(['rm', pathGroup])
    return "1" 

#Change groups index
@app.route('/_change_groups_index', methods=['POST'])
def change_groups_index():
    if 'ws_name' in session and 'map_name' in session:
        pathMap = path+"workspaces/"+session['ws_name']+"/"+session["map_name"]+"/"
        groups = request.json
        mapid = get_map_id(session['map_name'],session['ws_name'])

        wsmap = query_db('''select map_type from maps where map_id = ?''', [mapid], one=True)
        if wsmap['map_type'] == 'Scribe':
            pathGroup = path+"workspaces/"+session['ws_name']+"/"+session['map_name']+"/editor/groups/"
            
            inputConfigFile = codecs.open(pathMap + 'config', encoding='utf8')
            inputConfigContent = inputConfigFile.read()
            inputConfigFile.close()

            jsonConfig = json.loads(string2json(inputConfigContent))
            with open(pathMap+'config', 'w+') as f:
                f.write("ORDER {\n")
                for i in range(len(groups)):
                    f.write(" "+str(i+1)+": groups/"+groups[i]+".layer \n")
                f.write("}")
        else:
            for i in range(len(groups)):
                g.db.execute('''UPDATE groups SET group_index = ? WHERE group_name = ? AND map_id = ?''', [i,groups[i],mapid])
                g.db.commit()

    return "1" 

#===============================  
#           POI
#=============================== 
#Add POI     
@app.route('/_add_poi', methods=['POST'])
def add_poi():
    if 'ws_name' in session:

        name = request.form['name']
        lon = request.form['lon']
        lat = request.form['lat']
        scale = request.form['scale']

        expression = r"^[A-Za-z0-9][A-Za-z0-9 _-]{1,99}$"
        if (re.search(expression, name) is None):
            return "Invalid name"

        if ((re.search(r"^[0-9.-]{1,}$",lat) is None) or (re.search(r"^[0-9.-]{1,}$",lon) is None)):
            return "Invalid coordinate"

        #if (re.search(r"^[0-9]{1,2}$",scale) is None):
        #    return "Invalid scale level \nMust be between 1 and 18"

        lat = ((float(lat)+180)%360)-180
        lon = ((float(lon)+180)%360)-180

        ws_id = get_ws_id(session['ws_name'])

        pois = query_db("select * from pois where ws_id = ?", [ws_id], one=False)

        for i in range(len(pois)):
            if name == pois[i]['poi_name']:
                return "Name already exists"

        g.db.execute('insert into pois (poi_name, longitude, latitude, scalelvl, ws_id) values (?,?,?,?,?)',[name, lon, lat, scale, ws_id])
        g.db.commit()

    else:
        return "Open workspace first"
    return "1"

#Return list of POI
@app.route('/_get_pois', methods=['POST'])
def get_pois():
    if 'ws_name' in session:
        ws_id = get_ws_id(session['ws_name'])
        pois = query_db("select poi_name as name, scalelvl as scale, longitude as lon, latitude as lat from pois where ws_id = ?", [ws_id], one=False)
        return jsonify(pois = pois)

#Delete POI
@app.route('/_delete_poi', methods=['POST'])
def delete_poi():
    poiToDelete = request.form['poiToDelete']
    if 'ws_name' in session:
        g.db.execute('''DELETE FROM pois WHERE ws_id=? and poi_name=?''', [get_ws_id(session['ws_name']), poiToDelete])
        g.db.commit()
    else: 
        return "No workspace opened"
    return "1" 

#===============================  
#        Execute - Log
#===============================
#Commit changes
@app.route('/_commit',methods=['POST'])
def commit():
    data = request.json
    
    if save(data) != "1":
        return "Error: save()"
    else:
        return execute()

#Save changements
def save(data):
    pathMap = path+"workspaces/"+session['ws_name']+"/"+session["map_name"]+"/"
    wsmap = query_db('''select map_type from maps where ws_id = ? and map_name = ?''', [get_ws_id(session['ws_name']), session["map_name"]], one=True)
    
    if wsmap['map_type'] == 'Scribe':
        pathGroups = pathMap + "editor/groups/"
        for i in range(len(listfiles)):
            document = open(pathMap + listfiles[i]['url'], "w+")
            document.write(data[listfiles[i]['name']].encode('utf-8'))
            document.close()
        fusionStr = "LAYERS {\n"
        for i in range(len(data['groups'])):
            document = open(pathGroups + data['groups'][i]['name']+".layer", "w+")
            document.write(data['groups'][i]['content'].encode('utf-8'))
            document.close()
            fusionStr = "\n"+fusionStr + data['groups'][i]['content']+"\n"
        fusionStr = fusionStr + "}"
    
        fusionFile = open(pathMap + "editor/layers","w+" )
        fusionFile.write(fusionStr.encode('utf-8'))
        fusionFile.close()

    elif wsmap['map_type'] == 'Basemaps':
        pathGroups = pathMap
        for i in range(len(listfilesBasemaps)):
            document = open(pathMap + listfilesBasemaps[i]['url'], "w+")
            document.write(data[listfilesBasemaps[i]['name']].encode('utf-8'))
            document.close()
    elif wsmap['map_type'] == 'Standard':
        pathGroups = pathMap + "map/layers/"
        for i in range(len(listfilesStandard)):
            document = open(pathMap + listfilesStandard[i]['url'], "w+")
            document.write(data[listfilesStandard[i]['name']].encode('utf-8'))
            document.close()
        document = open(pathMap + "map/" + session["map_name"] + ".map", "w+")
        document.write(data['map'].encode('utf-8'))
        document.close()
    if wsmap['map_type'] != 'Scribe':
        for i in range(len(data['groups'])):
            document = open(pathGroups + data['groups'][i]['name'], "w+")
            document.write(data['groups'][i]['content'].encode('utf-8'))
            document.close()

    return "1"

#Execute python decoder
def execute():
    if ('ws_name' not in session) or ('map_name' not in session):
        return "No workspace or no map open"
    pathMap = (path+"workspaces/"+session['ws_name']+"/"+session['map_name'])+"/"
    wsmap = query_db('''select map_type from maps where ws_id = ? and map_name = ?''', [get_ws_id(session['ws_name']), session["map_name"]], one=True)

    if wsmap['map_type'] == 'Standard':
        result = '**Success**'
        return jsonify(result=result)

    if wsmap['map_type'] == 'Scribe':
        sub = subprocess.Popen('/usr/bin/python2.7 scribe.py -n ' + session['map_name'] + ' -i ' + pathMap + 'editor/ -o ' + pathMap + 'map/ -f ' + pathMap + 'config', shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE) 
    elif wsmap['map_type'] == 'Basemaps':
        os.chdir(pathMap)
        sub = subprocess.Popen("make", shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        os.chdir(path)

    logMsg = sub.stdout.read()
    errorMsg = sub.stderr.read()
    if (errorMsg == ""):
        if wsmap['map_type'] == 'Scribe':
            result = "**Success**\n\n**LOG**\n----------\n" + logMsg
    else:
        result = "**ERRORS**\n----------\n" + errorMsg + "\n**LOG**\n----------\n" + logMsg

    return jsonify(result=result)

#Return the contents of the mapfile generated 
@app.route('/_load_mapfile_generated',methods=['GET'])
def load_mapfile_generated():
    #mapToEdit = session["map_name"] #request.args.get('mapToEdit', '')
    if ('ws_name' in session):
        wsmap = query_db('''select map_type from maps where ws_id = ? and map_name = ?''', [get_ws_id(session['ws_name']), session["map_name"]], one=True)
        if wsmap['map_type'] == 'Scribe':
            pathMap = path+"workspaces/"+session['ws_name']+"/"+session['map_name']+"/map/"+session['map_name']+".map"
        elif wsmap['map_type'] == 'Basemaps':
            pathMap = path+"workspaces/"+session['ws_name']+"/"+session['map_name']+"/osm-"+session['map_name']+".map"
        elif wsmap['map_type'] == 'Standard':
            pathMap = path+"workspaces/"+session['ws_name']+"/"+session['map_name']+"/map/"+session['map_name']+".map"
        if (os.path.isfile(pathMap)):
            document = open(pathMap, "r") 
            content = document.read()
            document.close()
        else: 
            content = "No result - See logs for details"
    else:
        content = "No workspace open"
    return jsonify(text = content)

#===============================  
#          Debug
#===============================
@app.route('/_load_debug',methods=['GET'])
def load_debug():
    if ('ws_name' in session):
        pathDebug = path+"workspaces/"+session['ws_name']+"/"+session['map_name']+"/debugFile.log"
        
        if (os.path.isfile(pathDebug)):
            document = open(pathDebug, 'r')
            content = document.read()
            document.close()
        else:
            content = "No debug file"
    else:
        content = "No workspace open"
    return jsonify(text = content)

@app.route('/_clear_debug',methods=['GET'])
def clear_debug():
    if ('ws_name' in session):
        pathDebug = path+"workspaces/"+session['ws_name']+"/"+session['map_name']+"/debugFile.log"
        if (os.path.isfile(pathDebug)):
            subprocess.call(['rm', pathDebug])
    return "1"

#===============================  
#       Upload - download
#===============================
#def zipfolder(foldername, filename, includeEmptyDIr=True):
#    empty_dirs = []
#    zip = zipfile.ZipFile(filename, 'w', zipfile.ZIP_DEFLATED)
#    for root, dirs, files in os.walk(foldername):
#        empty_dirs.extend([dir for dir in dirs if os.listdir(join(root, dir)) == []])
#        for name in files:
#            zip.write(join(root ,name))
#        if includeEmptyDIr:
#            for dir in empty_dirs:
#                zif = zipfile.ZipInfo(join(root, dir) + "/")
#                zip.writestr(zif, "")
#        empty_dirs = []
#    zip.close()

@app.route('/_export_map',methods=['POST'])
def download_map():
    if ('ws_name' in session):
        mapname = request.form['name']
        dataPrivateBool = request.form['privateData']
        dataPublicBool = request.form['publicData']
        pathWS = path+"workspaces/"+session['ws_name']+"/"
        
        os.chdir(pathWS)
        
        randInt = str(random.randint(1,10000))
        if dataPrivateBool == 1:
            if dataPublicBool == 1:
                subprocess.call(['zip','-r','../../www/'+session['ws_name']+'_'+mapname+randInt, mapname])
            else :
                subprocess.call(['zip','-r','../../www/'+session['ws_name']+'_'+mapname+randInt, mapname, '-x', '*/pdata/*'])
        else:
            if dataPublicBool == 1:
                subprocess.call(['zip','-r','../../www/'+session['ws_name']+'_'+mapname+randInt, mapname, '-x', '*/data/*'])
            else:
                subprocess.call(['zip','-r','../../www/'+session['ws_name']+'_'+mapname+randInt, mapname, '-x', '*/?data/*'])
        
        os.chdir(path)

    return 'download/'+session['ws_name']+'_'+mapname+randInt+'.zip'

def getGroupFiles(pathMap, pathGroups):
    inputConfigFile = codecs.open(pathMap + 'config', encoding='utf8')
    inputConfigContent = inputConfigFile.read()
    inputConfigFile.close()
    jsonConfig = json.loads(string2json(inputConfigContent))
    groupFiles = [""] * (len(jsonConfig["ORDER"]) + 1)
    for i in range(0, len(jsonConfig["ORDER"])):
        for j in jsonConfig["ORDER"][i]:
            groupFiles[int(j)] = pathGroups + jsonConfig["ORDER"][i][j]
    return groupFiles

def getGroupNameFromFile(filePath):
    return os.path.splitext(os.path.basename(filePath))[0]

def string2json(string):
    #Remove the comments preceded by //
    t = re.sub(r"//.*", "", string)
    #Remove the comments between /* and */
    t = re.sub(r"/\*.*?\t*?\*/", "", t, flags=re.DOTALL)
    #Find and replace the comments preceded by ##
    comments = re.findall(r"\#\#.*", t, flags=0)
    t = re.sub(r"\#\#.*", "VOID:FLAGCOMMENT\n", t, flags=0)
    #Remove tabs
    t = re.sub(r"\t", " ", t) 
    #Replace @ with VARIABLE:
    t = re.sub(r"@", "VARIABLE:", t)
    #Find and replace the text between {{ and }} (useful for blocks like PROJECTION, METADATA, PATTERN etc.)
    texts = re.findall(r"(?<=\{\{).*?\t*?(?=\}\})", t, flags=re.DOTALL)
    t = re.sub(r"\{\{.*?\t*?\}\}", "{\nVOID:FLAGTEXT\n}", t, flags=re.DOTALL)
    #t = re.sub(r"(?<=\{{).*?\t*?(?=\}})", "\n{VOID:FLAGTEXT}\n", t, flags=re.DOTALL)
    #Find and replace values for the parameters (preceded by :)
    values = re.findall(r"(?<=:).+", t)
    t = re.sub(r"(?<=:).+", "FLAGVALUE", t)
    #Find and the parameters (followed by :)
    params = re.findall(r"\n*\s*[\w0-9\-]+\s*(?=[:\{])", t)
    t = re.sub(r"[\w0-9\-]+\s*(?=[:\{])", "FLAGPARAM", t)
    #Replace  { and } with [ and ]
    t = re.sub(r"\{", "[", t)
    t = re.sub(r"\}", "]", t)
    #Replace [ with :[
    t = re.sub(r"(?<!\()\s*\[", ":[", t)
    #Replace : with ":
    t = re.sub(r":\s*", "\":", t)
    #Replace : with :"
    t = re.sub(r"\s*:(?=\w)", ":\"", t)
    #Replace spaces followed by an alphanumeric chracter with {"
    t = re.sub(r"\s(?=\w)", "{\"", t)
    #Replace line break with \""},\n
    t = re.sub(r"\"[\s\n]+", "\\\"\"},\n", t)
    #Replace spaces preceded by alphabetic characters or _ with "},\n
    t = re.sub(r"(?<=[a-zA-Z_])\s", "\"},\n", t)    
    #Replace , followed by a ine break and ] with ]
    t = re.sub(r",\s+\n*\]", "]", t)    
    #Replace ] not preceded by and alphanumeric chracter with ]}
    t = re.sub(r"(?<!\w)\]", "]}", t) 
    #Substitute the FLAGVALUE with the corresponding values
    for i in range (0, len(values)):
        value = re.sub(r"\"", re.escape("\\") + "\"", values[i].strip())
        t = re.sub(r"FLAGVALUE", value, t, 1)
    #Substitute the FLAGPARAM with the corresponding values    
    for i in range (0, len(params)):
        param = re.sub(r"\"", re.escape("\\") + "\"", params[i].strip())
        t = re.sub(r"FLAGPARAM", param, t, 1)
    #Substitute the FLAGTEXT with "}{"VOID:":" and the corresponding texts
    for i in range (0, len(texts)):
        text = re.sub(r"\"", re.escape("\\") + "\"", texts[i].strip())
        text = re.sub(r"\n", "\"}{\"VOID\":\"", text)
        t = re.sub(r"FLAGTEXT", text, t, 1)
    #Substitute the FLAGCOMMENT with the corresponding comment blocks. Each line of the comment block is preceded with ##  
    for i in range (0, len(comments)):
        comment = re.sub(r"\"", re.escape("\\") + "\"", comments[i].strip())
        t = re.sub(r"FLAGCOMMENT",  comment, t, 1)
    #Make the JSON valid with some {},[]. SCALES has to be the first element in the file to be converted into a JSON.
    t = re.sub(r"\}\s*\n*\{", "},{", t)
    t = re.sub(r"\}\n*\s*\]\},\{\"LAYERS\"", "}],\"LAYERS\"", t)
    t = re.sub(r"\}\n*\s*\]\},\{\"MAP\"", "}],\"MAP\"", t)
    t = re.sub(r"\}\n*\s*\]\},\{\"VARIABLES\"", "}],\"VARIABLES\"", t)
    t = re.sub(r"^\s*\n*{\"", "", t)
    #Add {" before scale levels tag
    t = re.sub(r"\s(?=([0-9]|[0-9]{2})+\":)", "{\"", t)
    #Add {" at the beginning of the string and return a valid JSON string
    return ("{\"" + t)


#===============================  
#       Configure map
#===============================
@app.route('/_configure_map', methods=['POST'])
def configure_map():
    response = {'status': 'error'}
    if ('ws_name' in session):
        mapName = request.form['name']
        gitURL = request.form['gitURL']
        gitUser = request.form['gitUser']
        gitPassword = request.form['gitPassword']

        response = git_configure_map(mapName, gitURL, gitUser, gitPassword)

    return jsonify(response)

def git_configure_map(name, url, user, password):
    response = {'status': 'error'}

    mapID = get_map_id(name, session['ws_name'])
        
    mapPath = (path + "workspaces/" + session['ws_name'] + "/" + name) +"/"
    os.chdir(mapPath)

    wsmap = query_db('''select git_url, git_user, git_password from maps where ws_id = ? and map_name = ?''', [get_ws_id(session['ws_name']), name], one=True)
    
    errors = []

    if url != wsmap['git_url'] or user != wsmap['git_user'] or (password != wsmap['git_password'] and password != session['dummy_password']):
        # remove remote origin
        try:
            subprocess.check_output(['git remote rm origin'], shell=True, stderr=subprocess.STDOUT)
        except subprocess.CalledProcessError as e:
            pass
            #errors.append(e.output)

        # init new git
        try:
            subprocess.check_output(['git init'], shell=True, stderr=subprocess.STDOUT)
        except subprocess.CalledProcessError as e:
            errors.append(e.output)
        
        # link new git to remote url
        # user/password are coded directly in the git url 
        userString = user
        if password != '':
            if password == session['dummy_password']:
                userString += ':' + wsmap['git_password']    
            else:
                userString += ':' + password
        userString += '@'
        gitFullURL = 'https://' + userString + url[8:]

        try:
            subprocess.check_output(['git remote add origin ' + gitFullURL], shell=True, stderr=subprocess.STDOUT)
        except subprocess.CalledProcessError as e:
            errors.append(e.output)

        gitignore = open('.gitignore', 'w')
        gitignoreContent = 'data\n'
        gitignoreContent += 'pdata\n'
        gitignoreContent += 'debugFile.log\n'
        gitignoreContent += 'map/*\n'
        gitignoreContent += 'pdata'
        gitignore.write(gitignoreContent)

        if len(errors) == 0:
            if password != wsmap['git_password'] and password != session['dummy_password']:
                g.db.execute('''UPDATE maps SET git_url = ?, git_user = ?, git_password = ? WHERE map_id = ?''', [url, user, password, mapID])
            else:
                g.db.execute('''UPDATE maps SET git_url = ?, git_user = ? WHERE map_id = ?''', [url, user, mapID])
            g.db.commit()

        response['status'] = 'ok'

    response['errors'] = errors

    return response


#Return map config
@app.route('/_get_config', methods=['POST'])
def get_config():
    if 'ws_name' in session:
        mapName = request.form['name']
        wsID = get_ws_id(session['ws_name'])
        config = query_db("select git_url as gitURL, git_user as gitUser, git_password as gitPassword from maps where ws_id = ? and map_name = ?", [wsID, mapName], one=True)
        dummyPassword = generate_dummy_password(len(config['gitPassword']))
        session['dummy_password'] = dummyPassword
        config['gitPassword'] = dummyPassword
        return jsonify(config)

#===============================  
#       Git commit map
#===============================
@app.route('/_git_commit_map', methods=['POST'])
def git_commit_map():
    response = {'status': 'error'}
    if ('ws_name' in session):
        mapName = request.form['name']
        message = request.form['message']

        mapPath = (path + "workspaces/" + session['ws_name'] + "/" + mapName) +"/"
        os.chdir(mapPath)

        output = ''
        errors = []
        
        try:
            output += subprocess.check_output(['git add .'], shell=True, stderr=subprocess.STDOUT)
        except subprocess.CalledProcessError as e:
            errors.append(e.output)
            output += e.output
        
        try:
            output += subprocess.check_output(['git commit -m "' + message + '"'], shell=True, stderr=subprocess.STDOUT)
        except subprocess.CalledProcessError as e:
            if '(working directory clean)' in e.output:
                pass
            else:
                errors.append(e.output)
            output += e.output
        
        try:
            output += subprocess.check_output(['git pull origin master'], shell=True, stderr=subprocess.STDOUT)
        except subprocess.CalledProcessError as e:
            errors.append(e.output)
            output += e.output

        try:
            output += subprocess.check_output(['git push --verbose origin master'], shell=True, stderr=subprocess.STDOUT)
        except subprocess.CalledProcessError as e:
            errors.append(e.output)
            output += e.output
        
        if len(errors) == 0:
            response['status'] = 'ok'
        
        response['log'] = output
        response['errors'] = errors

    return jsonify(response)

#===============================  
#       Git clone map
#===============================
@app.route('/_git_clone_map', methods=['POST'])
def git_clone_map():
    response = {'status': 'error'}
    
    if ('ws_name' in session):
        mapName = request.form['name']
        
        gitURL = request.form['gitURL']
        gitUser = request.form['gitUser']
        gitPassword = request.form['gitPassword']

        mapPath = (path + "workspaces/" + session['ws_name'] + "/" + mapName) +"/"
        os.chdir(mapPath)
        
        response = git_configure_map(mapName, gitURL, gitUser, gitPassword)
        output = ''

        if response['status'] == 'ok':
            try:
                subprocess.check_output(['rm .gitignore'], shell=True, stderr=subprocess.STDOUT)
                output += subprocess.check_output(['git pull origin master'], shell=True, stderr=subprocess.STDOUT)
            except subprocess.CalledProcessError as e:
                response['errors'].append(e.output)
                output = e.output

        response['log'] = output
        
    return jsonify(response)