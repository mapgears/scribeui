from flask import Flask, request, session, g, current_app
from subprocess import Popen
import pprint, time, threading, os, sys, sqlite3, shutil

# Borg pattern, all processManager objects will have the same states
# meaning they all reference the same processes, lock and thread.
class Borg:
  _shared_state = {}
  def __init__(self):
    self.__dict__ = self._shared_state
# Pokes the processes to see their exit status. Stops when there is no running thread left.
class processManager(Borg):
	class pollProcesses (threading.Thread):
		def __init__(self, pManager):
			threading.Thread.__init__(self)
			self.pManager = pManager
		def run(self):
			while True:
				#poll exit codes:
				#None	Running
				#0		Finished nicely	
				#-n		terminated by signal n
				time.sleep(30)
				pprint.pprint("-----------")
				stop = True
				self.pManager.lock.acquire()
				updatedProcesses = []
				for p in self.pManager.processes:
					keep = True
					status = p.poll()
					pprint.pprint(str(p.jobid)+" "+str(p.pid)+" "+str(status))
					# If the job is running
					if status is None:
						stop = False # keep the thread alive
						job = self.pManager.getJob(p.jobid)
						if job["status"] == 2:
							self.pManager.stopProcess(p.jobid, True)
							continue;
					else:
						if status != 0:
							status = 2 
						try:
							self.pManager.updateJob(p.jobid, status)
							keep = False #once we have the new status, keeping track of the process is useless
						except OperationalError:
							#If the database is locked, we force looping again
							stop = False
					if keep:
						updatedProcesses.append(p)	
				self.pManager.processes = updatedProcesses
				self.pManager.lock.release()
				if stop:
					pprint.pprint("-----------")
					pprint.pprint("No process running, stopping poll.")
					break;
	
	def __init__(self):
		Borg.__init__(self)
		if not hasattr(self, "processes"):
			self.processes = []
		if not hasattr(self, "lock"):
			self.lock = threading.Lock()
		if not hasattr(self, "thread"):
			self.thread = None

	def addProcess(self, job, projectdir, zoomLevels, metatile, extent):
		pprint.pprint("-----------")
		path = os.path.realpath(__file__)
			
		# Create mapcache folder if not exist
		if not os.path.exists(projectdir+"/mapcache"):
			os.makedirs(projectdir+"/mapcache")
		
		#If there is a gitignore file, add the mapcache directory
		if os.path.exists(projectdir+"/.gitignore"):
			with open(projectdir+"/.gitignore", "r+") as gitignore:
				lines = gitignore.readlines()
				found = False
				for line in lines:
					if "mapcache" in line:
						found = True
				if not found:	
					gitignore.writelines("mapcache/*")

		jobdir = projectdir+"/mapcache/job-"+job['title']+str(job['id'])
		os.makedirs(jobdir)
		
		inFile = open(path.replace("processManager.py","mapcacheConfig.xml.default"))
		outFile = open(jobdir+"/mapcacheConfig.xml","w")
		replacements = {'<!--SCRIBEUIPATH-->':jobdir, '<!--SCRIBEUITITLE-->':"job-"+job['title']+str(job['id']), '<!--SCRIBEUIMAPFILEPATH-->':projectdir+'/map/'+job['map_name']+'.map'}

		for line in inFile:
			for src, target in replacements.iteritems():
				line = line.replace(src, target)
			outFile.write(line)
		inFile.close()
		outFile.close()
		#start mapcache
		pprint.pprint("Adding new process")
		p = Popen(["mapcache_seed", "-c", jobdir+"/mapcacheConfig.xml", "-t", "default", "-z", zoomLevels, "-M", metatile, "-e",extent], shell=False)
		p.jobid = job['id']
		
		# Lock the processes list before adding data
		self.lock.acquire()
		self.processes.append(p)

		#If thread is finished, start it up
		if self.thread is None or not self.thread.isAlive():
			self.thread = None
			self.thread = self.pollProcesses(self)
			self.thread.start()
		self.lock.release()
		return
	
	#Stops the process. 
	# If locked is True, the process array cannot be changed as it is already locked
	# by the caller, so accessing it is safe
	def stopProcess(self, jobid, locked):
		pprint.pprint("STOP job"+str(jobid))
		if not locked:
			self.lock.acquire()
		for p in self.processes:
			if p.jobid == jobid:
				p.terminate()
		if not locked:
			self.lock.release()
		return

	def updateJob(self, jobid, status):
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

	def getJob(self, jobid):
		con = None
		try:
			con = sqlite3.connect('db/database.db')
			cur = con.cursor()    
			
			cur.execute('select * from jobs WHERE id=?', [jobid])
			rv = [dict((cur.description[idx][0], value)
               for idx, value in enumerate(row)) for row in cur.fetchall()]

			return rv[0];

		except sqlite3.Error, e:
			print "Error %s:" % e.args[0]
			sys.exit(1)
		finally:
			if con:
				con.close()
