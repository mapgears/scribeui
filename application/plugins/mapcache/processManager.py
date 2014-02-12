from flask import Flask, request, session, g, current_app
from subprocess import Popen
import pprint, time, threading, os, sys, sqlite3

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

def addProcess(jobid):
	global thread, processes
	pprint.pprint("-----------")
	path = os.path.realpath(__file__)
	path = path.replace("processManager.py","testscript.sh")
	pprint.pprint("Adding new process")
	p = Popen([path])
	p.jobid = jobid
	
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
