# all the imports 
from flask import Flask, request, session, render_template, jsonify, g
import os, sys
import sqlite3 #Database 
from contextlib import closing #Database
import re #regular expression
from werkzeug import check_password_hash, generate_password_hash, secure_filename
import subprocess
import json #commit

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
listfiles = [{'name':'scales','url':'editor/scales','fusion':'true'},
             {'name':'variables','url':'editor/variables','fusion':'true'},
             {'name':'map','url':'editor/map','fusion':'true'},
             {'name':'projections','url':'epsg','fusion':'false'}, 
             {'name':'fonts','url':'fonts.lst','fusion':'false'},
             {'name':'symbols','url':'symbols.map','fusion':'false'},
             ]
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
#          Homepage                              
#===============================
#Homepage of the application
@app.route('/')
def index():
    return render_template('index.html')

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
    
    ws = query_db('''select * from workspaces where ws_name = ?''', [wsToDelete], one=True)  
    if ws is None:
        return 'Invalid workspace'
    elif not check_password_hash(ws['password'], request.form['password']):
        return 'Invalid password'
        
    wsmap = query_db('''select * from maps where ws_id = ?''', [ws['ws_id']], one=False)
    for i in range(len(wsmap)): 
        g.db.execute('''DELETE FROM groups WHERE map_id=?''', [wsmap[i]['map_id']])
        connectorFile = "/usr/lib/cgi-bin/elfinder-python/connector-"+wsToDelete+"-"+wsmap[i]['map_name']+".py"
        subprocess.call(['rm','-f',connectorFile])
    g.db.execute('''DELETE FROM maps WHERE ws_id=?''', [ws['ws_id']])
    g.db.execute('''DELETE FROM workspaces WHERE ws_id=?''', [ws['ws_id']])
    g.db.commit()
 
    subprocess.call(['rm','-r', path+"workspaces/"+ws['ws_name']])

    session.pop('ws_name', None)
    session.pop('map_name', None)
    return "1" 

#===============================
#          Maps 
#=============================== 
#Create a new map from a template        
@app.route('/_create_map', methods=['POST'])
def create_map():
    name = request.form['name']
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
    g.db.execute('insert into maps (map_name, map_desc, ws_id) values (?, ?, ?)',
                 [name, description, get_ws_id(session['ws_name'])])
    g.db.commit()

    #Copy the template directory to the directory of the new map    
    if ws_template == "templates":
        templateDir = template[1:]
        pathTemplate = path+"workspaces/templates/"+templateDir
        map_cur = (query_db('''select map_id from maps where map_name = ? and ws_id = "0"''',[template], one=True))
    else:
        pathTemplate = path+"workspaces/"+ws_template+"/"+template
        map_cur = get_map_id(template, ws_template)

    pathMap = path+"workspaces/"+session['ws_name']+"/"+name
    subprocess.call(['cp','-R', pathTemplate, pathMap])
    subprocess.call(['mv', pathMap+"/map/"+templateDir+".map", pathMap+"/map/"+name+".map"])                                

    #Add layers in the bd
    groups = query_db('''select * from groups where map_id = ?''', [map_cur['map_id']], one=False)
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
        maps["url"] = "http://" + ip + "/cgi-bin/mapserv?map=" + path + "workspaces/" + session['ws_name'] + "/" + wsmap[i]['map_name'] +  "/map/" + wsmap[i]['map_name'] +".map"
        maps["description"] = wsmap[i]['map_desc']
        listmaps["maps"].append(maps)

    return jsonify(**listmaps)

#Open map    
@app.route('/_open_map',methods=['POST'])
def open_map():
    namemap = request.form['name']
    pathMap = path + "workspaces/" + session['ws_name'] + "/" + namemap + "/"
    wsmap = query_db('''select * from maps where ws_id = ? and map_name = ?''', [get_ws_id(session['ws_name']), namemap], one=True)
    
    contentfiles = {}
    contentfiles['name'] = namemap
    contentfiles["url"] = "http://" + ip + "/cgi-bin/mapserv?map=" + pathMap + "map/" + namemap +".map"
    for i in range(len(listfiles)):
        document = open(pathMap + listfiles[i]['url'], "r")
        contentfiles[listfiles[i]['name']] = document.read()
        document.close()

    contentfiles['groups'] = []
    groups = query_db('''select group_name, group_index from groups where map_id = ?''', [wsmap['map_id']], one=False)
    groups = sorted(groups)
    for j in range(len(groups)):
        unGroup = {}
        unGroup["name"] = groups[j]['group_name']
        document = open(pathMap + "editor/groups/"+ unGroup["name"], "r")
        unGroup["content"] = document.read()
        document.close()
        contentfiles["groups"].append(unGroup)

    #Parameters map
    contentfiles['errorMsg']=[]
    try:
        json_file = open(pathMap+"temp.json")
        data = json.load(json_file);
        json_file.close();
    except:
        contentfiles['errorMsg'].append("The header is bad")
    try:
        contentfiles['OLScales']=list2dict(data['SCALES'])
    except:
        contentfiles['OLScales'] = "NULL"
        contentfiles['errorMsg'].append("SCALES not found")
    try:
        contentfiles['OLExtent']=list2dict(data['MAP'])['EXTENT']
    except:
        contentfiles['OLExtent'] = "NULL"
        contentfiles['errorMsg'].append("EXTENT not found")    
    try:
        contentfiles['OLUnits']=list2dict(data['MAP'])['UNITS'] 
    except:
        contentfiles['OLUnits'] = "NULL"
        contentfiles['errorMsg'].append("UNITS not found")
    try:
        contentfiles['OLProjection']=list2dict(list2dict(data['MAP'])['PROJECTION'])['VOID'].split('=',1)[1][0:-1]
    except:
        contentfiles['OLProjection'] = "NULL"  
        contentfiles['errorMsg'].append("PROJECTION not found")    
    
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
    try:
        ws_name = request.form['ws_name']
        if ws_name == 'templates':
           ws_id = '0';
        elif ws_name == '':
            ws_id = get_ws_id(session['ws_name'])
        else:
            ws_id = get_ws_id(ws_name)
    except:
        ws_id = get_ws_id(session['ws_name'])
        
    wsmap = query_db('''select map_name from maps where ws_id = ?''', [ws_id], one=False)
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

        expression = r"^[A-Za-z0-9][A-Za-z0-9_]{1,99}$"
        if (re.search(expression, groupname) is None):
            return "Invalid name"
                         
        mapid = get_map_id(session['map_name'],session['ws_name'])
        groups = query_db("select group_name, group_index from groups where map_id = ?", [mapid], one=False)
        if groups:
            groups = sorted(groups)
            maxindex = groups[-1]['group_index']
        else:
            maxindex = 0  

        for i in range(len(groups)):
            if groupname == groups[i]['group_name']:
                return "Existing"
                                                    
        g.db.execute('insert into groups (group_name, group_index, map_id) values (?,?,?)',[groupname, maxindex+1, mapid])
        g.db.commit()
        
        pathGroup = path+"workspaces/"+session['ws_name']+"/"+session['map_name']+"/editor/groups/"+groupname 
        file(pathGroup, 'w+')

    return "1"

#Remove Group
@app.route('/_remove_group', methods=['POST'])
def remove_group():
    if 'ws_name' in session and 'map_name' in session:
        groupname = request.form['name']

        mapid = get_map_id(session['map_name'],session['ws_name'])
        g.db.execute("DELETE from groups where map_id = ? and group_name = ?", [mapid, groupname])
        g.db.commit()

        groupname = groupname
        pathGroup = path+"workspaces/"+session['ws_name']+"/"+session['map_name']+"/editor/groups/"+groupname
        if os.path.isfile(pathGroup) :
            subprocess.call(['rm', pathGroup])
    return "1" 

#Change groups index
@app.route('/_change_groups_index', methods=['POST'])
def change_groups_index():
    if 'ws_name' in session and 'map_name' in session:
        groups = request.json
        mapid = get_map_id(session['map_name'],session['ws_name'])

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
        #print "EXECUTE"
        return execute()

#Save changements
def save(data):
    pathMap = path+"workspaces/"+session['ws_name']+"/"+session["map_name"]+"/"
    
    #subprocess.call(['rm', pathMap+"map/"+session["map_name"]+".map"])
    #subprocess.call(['rm', pathMap+"editor/temp/"+session["map_name"]])

    fusionStr = ""
    for i in range(len(listfiles)):
        document = open(pathMap + listfiles[i]['url'], "w+")
        document.write(data[listfiles[i]['name']].encode('utf-8'))
        document.close()
        if listfiles[i]['fusion'] == 'true':
            fusionStr = fusionStr + data[listfiles[i]['name']]+"\n\n"

    fusionStr = fusionStr + "LAYERS [\n"
    for i in range(len(data['groups'])):
        document = open(pathMap + "editor/groups/" + data['groups'][i]['name'], "w+")
        document.write(data['groups'][i]['content'].encode('utf-8'))
        document.close()
        fusionStr = "\n"+fusionStr + data['groups'][i]['content']+"\n"
    fusionStr = fusionStr + "]"

    fusionFile = open(pathMap + "editor/temp/" + session['map_name'],"w+" )
    fusionFile.write(fusionStr.encode('utf-8'))
    fusionFile.close()
    #print "SAVE"
    return "1"

#Execute python decoder
def execute():
    if ('ws_name' not in session) or ('map_name' not in session):
        return "No workspace or no map open"
    pathMap = (path+"workspaces/"+session['ws_name']+"/"+session['map_name'])+"/"
    sub = subprocess.Popen('python decoder.py '+pathMap+'editor/temp/'+session['map_name']+' '+pathMap+' '+session['map_name']+'.map', shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    
    if (sub.stderr.read() == ""):
        symbolsFile = open(pathMap+"symbols.map", "r")
        symbols = symbolsFile.read()
        symbolsFile.close()
        source = open(pathMap+"/map/"+session['map_name']+".map", "r")
        contentS = source.read()
        source.close()
        contentD = contentS.replace("###SYMBOLS###", symbols)
        destination = open(pathMap+"/map/"+session['map_name']+".map", "w")
        destination.write(contentD)#.encode('utf-8'))
        destination.close()

        result = "Success"
    else:
        result = "**ERRORS**\n------\n" + sub.stderr.read()+sub.stdout.read()

    return jsonify(result=result)

#Return the contents of the mapfile generated 
@app.route('/_load_mapfile_generated',methods=['GET'])
def load_mapfile_generated():
    mapToEdit = request.args.get('mapToEdit', '')
    if ('ws_name' in session):
        pathMap = path+"workspaces/"+session['ws_name']+"/"+mapToEdit+"/map/"+mapToEdit+".map"
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
    return "OK"

#===============================  
#       Upload - download
#===============================

