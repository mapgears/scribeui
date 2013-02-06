ScribeUI
=========

ScribeUI is an application to create mapfiles with many scale levels.

Requirements
------------
 * Apache
 * Python
    * Tested with 2.7.3 only
 * Mod WSGI
    * sudo apt-get install libapache2-mod-wsgi
 * Flask
    * sudo pip install Flask
 * Mapserver
    * must be version 6.0 or higher
 * Sqlite3

Configuration
-------------
 * To reset the sqlite3 database, in the TileSwarm/application directory, execute in a python shell (sudo python):

    `from init import init_db`  
    `init_db()`

 * Place elfinder-python in your cgi-bin repository (/usr/lib/cgi-bin)

 * The owner of the the db folder and the workspace folder must be the current user or www-data if the application is on a server:

    `sudo chown -R www-data db`  
    `sudo chown -R www-data workspaces`
    `sudo chown -R www-data www`
    `sudo chown www-data /usr/lib/cgi-bin/elfinder-python/`   

 * Change the path of the application in application/runserver.wsgi

 * Change ip variable in config.py

Apache configuration
--------------------
In /etc/apache2/sites-enabled/ScribeUI.conf, use the following configuration (change the path):

    #ScribeUI     
    
    WSGIScriptAlias /ScribeUI /opt/apps/ScribeUI/application/runserver.py
    AddType text/html .py
    <Directory /opt/apps/ScribeUI/application/templates>
      Order deny,allow
      Allow from all
    </Directory>

    Alias /scribeui/download/ "/opt/apps/ScribeUI/application/www/"
    <Directory "/opt/apps/ScribeUI/application/www/">
      AllowOverride None
      Options Indexes FollowSymLinks Multiviews
      Order allow,deny
      Allow from all
    </Directory>

