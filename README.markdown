TileSwarm
=========

TileSwarm is an application to create mapfiles with many scale levels.

Requirements
------------
 * Apache
 * Python
    * Tested with 2.7.3 only
 * Mod WSGI
    * sudo apt-get install libapache2-mod-wsgi
 * Flask
    * pip install Flask
 * Mapserver
    * must be version 6.0 or higher
 * Mapcache
 * Sqlite3

Configuration
-------------
 * To reset the sqlite3 database, in the TileSwarm/application directory, execute in a python shell (sudo python):

    `from init import init_db`  
    `init_db()`

 * The owner of the the db folder and the workspace folder must be the current user or www-data if the application is on a server:

    `sudo chown -R www-data db`  
    `sudo chown -R www-data workspaces`
    `sudo chown www-data /usr/lib/cgi-bin/elfinder-python/`   

 * Change the path of the application in runserver.wsgi

 * Place elfinder-python in your cgi-bin repository (/usr/lib/cgi-bin)

Apache configuration
--------------------
In /etc/apache2/mods-enabled/wsgi.conf, use the following configuration (change the path):

    #Tile Swarm            
    
    WSGIScriptAlias /tileswarm /opt/TileSwarm/application/runserver.py
    
    AddType text/html .py
    
    <Directory /opt/TileSwarm/application/templates>
      Order deny,allow
      Allow from all
    </Directory>
