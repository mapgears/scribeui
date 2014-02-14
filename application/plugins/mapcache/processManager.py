from flask import Flask, request, session, g, current_app
from subprocess import Popen
import pprint, time, threading, os, sys, sqlite3, shutil

# Pokes the processes to see their exit status. Stops when there is no running thread left.
class pollProcesses (threading.Thread):
    def __init__(self):
        threading.Thread.__init__(self)
    def run(self):
		global lock, processes
		while True:
			#poll exit codes:
			#None	Running
			#0		Finished nicely	
			#-n		terminated by signal n
			time.sleep(1)
			pprint.pprint("-----------")
			lock.acquire()
			stop = True
			for p in processes:
				status = p.poll()
				pprint.pprint(str(p.jobid)+" "+str(p.pid)+" "+str(status))
				if status is None:
					stop = False
				else:
					if status != 0:
						status = 2
					updateJob(p.jobid, status)						
			lock.release()
			if stop:
				pprint.pprint("-----------")
				pprint.pprint("No process running, stopping scan.")
				break;

processes = []
lock = threading.Lock()
thread = None

def addProcess(job, projectdir):
	global thread, processes
	pprint.pprint("-----------")
	path = os.path.realpath(__file__)
		
	# Create mapcache folder if not exist
	if not os.path.exists(projectdir+"/mapcache"):
		os.makedirs(projectdir+"/mapcache")
	jobdir = projectdir+"/mapcache/job-"+job['title']+str(job['id'])
	os.makedirs(jobdir)
	
	inFile = open(path.replace("processManager.py","mapcacheConfig.xml.default"))
	outFile = open(projectdir+"/mapcacheConfig.xml","w")
	replacements = {'<!--SCRIBEUIPATH-->':jobdir, '<!--SCRIBEUITITLE-->':"job-"+job['title']+str(job['id']), '<!--SCRIBEUIMAPFILEPATH-->':projectdir+'/map/'+job['map_name']+'.map'}

	for line in inFile:
		for src, target in replacements.iteritems():
			line = line.replace(src, target)
		outFile.write(line)
	inFile.close()
	outFile.close()
	
	pprint.pprint("Adding new process")
	p = Popen(["mapcache_seed -c "+projectdir+"/mapcacheConfig.xml -t default -z 1,5 -M 8,8"], shell=True)
	p.jobid = job['id']
	
	# Lock the processes list before adding data
	lock.acquire()
	processes.append(p)
	lock.release()
	

	#If thread is finished, start it up
	if thread is None or not thread.isAlive():
		pprint.pprint("Starting thread")
		thread = None
		thread = pollProcesses()
		thread.start()
	return

def stopProcess(jobid):
	for p in processes:
		if p.jobid == jobid:
			p.terminate()
	return

def updateJob(jobid, status):
	con = None
	try:
		con = sqlite3.connect('db/database.db')
		cur = con.cursor()    
		
		cur.execute('UPDATE jobs SET status = ? WHERE id=?', [status, jobid])
		con.commit()

	except sqlite3.Error, e:
		print "Error %s:" % e.args[0]
		sys.exit(1)
	finally:
		if con:
			con.close()
