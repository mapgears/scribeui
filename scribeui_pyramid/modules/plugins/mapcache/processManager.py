#from flask import Flask, request, session, g, current_app
from subprocess import Popen
import pprint, time, threading, os, sys, sqlite3, shutil

from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy import exc
import transaction

from .models import Job

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
                #None    Running
                #0        Finished nicely    
                #-n        terminated by signal n
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
                        if job.status == 2:
                            self.pManager.stopProcess(p.jobid, True)
                            continue;
                    else:
                        if status != 0:
                            status = 2 
                        try:
                            self.pManager.updateJob(p.jobid, status)
                            keep = False #once we have the new status, keeping track of the process is useless
                        except Exception, e:
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

    def addProcess(self, job, projectdir, mapfile, zoomLevels, metatile, grid, 
            extent=None, dbconfig=None, jobdir=None, mapserver_url='http://localhost/cgi-bin/mapserv'):
        projectdir = projectdir.rstrip('/')

        pprint.pprint("-----------")
        path = os.path.dirname(os.path.abspath(__file__))

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

        if not jobdir:
            jobdir = projectdir+"/mapcache/job-"+job.title+str(job.id)
        else:
            jobdir = jobdir.rstrip('/') + '/' + job.title+str(job.id)
        if not os.path.exists(jobdir):
            os.makedirs(jobdir)

        inFile = open(path + "/mapcacheConfig.xml.default")
        outFile = open(jobdir+"/mapcacheConfig.xml","w")
        replacements = {
            '<!--SCRIBEUIPATH-->':jobdir, 
            '<!--SCRIBEUITITLE-->':"job-"+job.title+str(job.id), 
            '<!--SCRIBEUIMAPFILEPATH-->':mapfile,
            '<!--SCRIBEUIMAPSERVER-->':mapserver_url
        }

        for line in inFile:
            for src, target in replacements.iteritems():
                line = line.replace(src, target)
            outFile.write(line)
        inFile.close()
        outFile.close()

        pprint.pprint("Adding new process")

        if extent:
            if extent[0] == '/' and extent[-4:] == '.shp' and os.path.isfile(extent):
                p = Popen(["mapcache_seed", "-c", jobdir+"/mapcacheConfig.xml", "-t", "default", "-z", zoomLevels, "-M", metatile, "-g", grid, "-d", extent], shell=False)
            else:
                p = Popen(["mapcache_seed", "-c", jobdir+"/mapcacheConfig.xml", "-t", "default", "-z", zoomLevels, "-M", metatile, "-g", grid, "-e", extent], shell=False)

        elif dbconfig:
            #TODO: ADD SUPPORT FOR OTHER DATABASE TYPE
            #ALSO, THIS CODE COULD PROBABLY BE PLACED IN A FUNCTION SOMEWHERE ELSE 
            if dbconfig['type'].lower() == 'postgis':
                connection_string = 'PG:dbname=' + dbconfig['name'] + ' host=' + dbconfig['host'] + ' port=' + dbconfig['port'] + ' user=' + dbconfig['user'];
                if dbconfig['password']:
                    connection_string += ' password=' + dbconfig['password'] 
            else:
                connection_string = ''

            query_string = dbconfig['query'].rstrip(';')

            p = Popen(["mapcache_seed", "-c", jobdir+"/mapcacheConfig.xml", "-t", "default", "-z", zoomLevels, "-M", metatile, "-g", grid, "-d", connection_string, '-s', query_string], shell=False)

        p.jobid = job.id
        
        # Lock the processes list before adding data
        self.lock.acquire()
        self.processes.append(p)

        #If thread is finished, start it up
        if self.thread is None or not self.thread.isAlive():
            pprint.pprint("Starting thread")
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
        try:
            job = Job.by_id(jobid)
        except NoResultFound as e:
            print "Error %s:" % e.args[0]
            raise Exception(e.args[0])

        try:
            job.status = status
            transaction.commit()
        except exc.SQLAlchemyError as e:
            print "Error %s:" % e.args[0]
            raise Exception(e.args[0])


    def getJob(self, jobid):
        job = None
        try:
            job = Job.by_id(jobid)
        except NoResultFound as e:
            print "Error %s:" % e.args[0]
            raise Exception(e.args[0])

        return job
