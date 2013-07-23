ScribeUI
=========

ScribeUI is an application to create mapfiles with many scale levels.

Requirements
------------
*   Apache
*   Python (tested with 2.7.3 only)
*   Mod WSGI
*   Flask
*   MapServer (version 6.0 or higher)
*   Sqlite3

You can install them using aptitude and pip:

    sudo apt-get install apache2 libapache2-mod-wsgi Flask cgi-mapserver sqlite3
    sudo pip install Flask

Configuration
-------------
 *  To reset the sqlite3 database, open a python shell as admin from the
    the application directory:

        cd application
        sudo python

    in the python shell:

        from init import init_db
        init_db()

 *  Place elfinder-python in your cgi-bin repository (/usr/lib/cgi-bin)

        sudo cp -ap elfinder-python /usr/lib/cgi-bin/

 *  The owner of the the db folder and the workspace folder must be the
    current user or www-data if the application is on a server:

        sudo chown -R www-data application/db application/workspaces \
        application/www /usr/lib/cgi-bin/elfinder-python/

 *  Make a copy of the application/runserver.dist.wsgi file as
    application/runserver.wsgi and edit it. Change the path accordingly.

        cp application/runserver.dist.wsgi application/runserver.wsgi
        vim application/runserver.wsgi

 *  Make a copy of the config.dist.py file as config.py and edit it. Change the
    ip variable accordingly.

        cp config.dist.py config.py
        vim config.py

 *  Run the makefile to download the data

        make


Apache configuration
--------------------
In /etc/apache2/sites-enabled/ScribeUI.conf, use the following configuration
(change the path):

    #ScribeUI     
    
    WSGIScriptAlias /ScribeUI /opt/apps/ScribeUI/application/runserver.py
    AddType text/html .py
    <Directory /opt/apps/ScribeUI/application/templates>
      Order deny,allow
      Allow from all
    </Directory>

    Alias /ScribeUI/download/ "/opt/apps/ScribeUI/application/www/"
    <Directory "/opt/apps/ScribeUI/application/www/">
      AllowOverride None
      Options Indexes FollowSymLinks Multiviews
      Order allow,deny
      Allow from all
    </Directory>

