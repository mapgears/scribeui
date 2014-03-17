# Job status
#	0 - Finished 
#	1 - In progress
#	2 - Stopped (error)
'''
from flask import Flask, Blueprint, render_template, url_for, current_app, request, g, jsonify
import simplejson, pprint, sys, os
from processManager import processManager

sys.path.append("../../") # Gives access to init.py functions

plugin = Blueprint('mapcache', __name__, static_folder='static', template_folder='templates')

def getJsFiles():
	createTable()
	return url_for('mapcache.static',filename='js/mapcache.js')

def getCssFiles():
    return url_for('mapcache.static',filename='css/mapcache.css')

@plugin.route('/startjob', methods=['GET'])
def startJob():
	from init import get_map_id # Cannot be imported at beginning of file because of circular import
	if not hasattr(g, "pManager"):
		g.pManager = processManager()
		
	workspaceName = request.args.get("ws",'')
	mapName = request.args.get("map",'')
	jobTitle = request.args.get("title",'')
	mapEntry = get_map_id(mapName, workspaceName)
	if mapEntry is not None:
		cur = g.db.execute('INSERT INTO jobs(map, status, title) VALUES(?,?, ?)',[mapEntry, 1, jobTitle])
		g.db.commit()
		jobid = cur.lastrowid;
		job = getJob(jobid)
		
		#finding the project's path
		curdir = os.path.realpath(__file__)
		last = curdir.find("application")
		projectdir = curdir[:last] + "application/workspaces/"+workspaceName+"/"+mapName
		pprint.pprint(g.pManager)
		g.pManager.addProcess(job[0], projectdir)
		return simplejson.dumps(job)
	else:
		return "ERROR: "+mapName+" map is unavailable or does not exist"

@plugin.route('/getjobs', methods=['GET'])
def printJobs():
	from init import get_ws_id 
	workspaceName = request.args.get("ws",'')
	workspaceId = get_ws_id(workspaceName)
	
	if workspaceId is not None:
		jobs = getJobs(workspaceId)
		return simplejson.dumps(jobs)
	else:
		return "ERROR: Invalid workspace id"

#Clear job removes a finished (status 0 or 2) job from the database.
@plugin.route('/clearjob', methods=['GET'])
def clearJob():
	jobId = request.args.get("job",'')
	
	job = getJob(jobId)
	
	if job:
		if job[0]['status'] == 1: #Cancel clear if job is still in progress 
			return '[{"result": "Error", "message","Job is in progress, please stop before clearing"}]'
		else:	
			g.db.execute('DELETE FROM jobs WHERE id=?',[job[0]['id']])
			g.db.commit()
			#TODO handle db errors
			return '[{"result":"Success", "message":"Job '+str(job[0]['id'])+' for '+job[0]['map_name']+' was cleared.", "jobid":"'+str(job[0]['id'])+'"}]'
		
		return "Clear"
	else:
		return "Job missing. Was it cleared already?"

#Stop job in progress
@plugin.route('/stopjob', methods=['GET'])
def stopJob():
	if not hasattr(g, "pManager"):
		g.pManager = processManager()
		
	jobId = request.args.get("job",'')
	
	job = getJob(jobId)
	
	if(job):
		warning = False	
		if job[0]['status'] == 1: 
			g.pManager.stopProcess(job[0]['id'], False)
			g.db.execute('UPDATE jobs SET status=2 WHERE id=? and status=1',[job[0]['id']])
			g.db.commit()
			job = getJob(jobId)
			if job[0]['status'] == 2: 
				#TODO handle db errors
				return '[{"result":"Success", "message":"Job '+str(job[0]['id'])+' for '+job[0]['map_name']+' was stopped.", "jobid":"'+str(job[0]['id'])+'"}]'
			
			else: #in the event the job finished already
				warning = True
		else:
			warning = True

		if warning:
			return '[{"result": "Warning","message":"Job was already finished or stopped","job":'+simplejson.dumps(job)+'}]'
	else:
		return "Job missing. Was it cleared already?"



def getJobs(ws):
	from init import query_db 
	return query_db('select jobs.id, jobs.title, jobs.status, jobs.map, maps.map_name from jobs, maps where maps.map_id = jobs.map and maps.ws_id = ?', [ws])

def getJob(i):
	from init import query_db 
	return query_db('select jobs.id, jobs.title, jobs.status, jobs.map, maps.map_name from jobs, maps where maps.map_id = jobs.map and jobs.id=?', [i])

# Creates the table if it doesn't exist
def createTable():
	rv = g.db.execute("CREATE TABLE IF NOT EXISTS jobs(id integer primary key autoincrement, title varchar(255) not null default '', map integer not null, status integer not null)")
	g.db.commit()
	return
'''