ScribeUI
=========

ScribeUI is an application to create mapfiles with many scale levels.

To get the latest **release**, clone this repo and then checkout the latest tag. ``` git describe --abbrev=0 ``` to view the latest tag.

Development installation
------------

These instructions are for running a development version of ScribeUI. It is pretty good for a local version of the application. Production installation instructions are available below.

    cp development.ini local.ini

Review the following parameters in local.ini, and edit them as needed:
	- sqlalchemy.url
	- workspaces.directory
	- scribe.python
	- cgi.directory
	- mapserver.url

Edit the proxy.cgi file and add your server host to the list of allowed hosts

Copy the proxy.cgi file in your cgi-bin directory

You can use the Makefile to automatically setup ScribeUI for you, simply run:

        make
        sudo make install

This will download and install the required dependencies, setup the differents
configurations files and install them in the proper directories. 

To launch the server at http://localhost:6543/:

        make start

Downloading template data is optional, but recommended for a better 
experience.  The basicscribe-data option is for a light download: 

        sudo make load-demo-data   ==> (644Mb)
or

        sudo make load-basicscribe-data   ==> (8Mb)

This will download some natural earth data and will help you get started with
ScribeUI by making templates readily working so you don't start with an empty
mapfile. (The template code is still available if you don't download the data,
but the result will be pink tiles). 

Production installation
------------

You need to install apache2 with mod_wsgi: 

    sudo apt-get install apache2 libapache2-mod-wsgi 

Configuration
-------------
 
Review the following parameters in production.ini, and edit them as needed:
	- sqlalchemy.url
	- workspaces.directory
	- scribe.python
	- cgi.directory
	- mapserver.url

Then:

    cp development.ini local.ini

Edit the proxy.cgi file and add your server host to the list of allowed hosts

Copy the proxy.cgi file in your cgi-bin directory

You can use the Makefile to automatically setup ScribeUI for you, simply run:

        make
        sudo make install

www-data needs to be the owner of the workspace folder, scribeui_pyramid directory and the database:

    sudo chown -r www-data workspaces scribeui.lite scribeui_pyramid

Create a file 'pyramid.wsgi' with the following content:

	from pyramid.paster import get_app, setup_logging
	ini_path = '/path/to/scribeui_pyramid/production.ini'
	setup_logging(ini_path)
	application = get_app(ini_path, 'main')

Next step is adding the app to apache, here is an example configuration:

    WSGIDaemonProcess scribeui_pyramid user=www-data group=www-data threads=10 \
	        python-path=/path/to/scribeui_pyramid/lib/python2.7/site-packages
	WSGIScriptAlias /scribeui_pyramid /path/to/scribeui_pyramid/pyramid.wsgi

	<Directory /path/to/scribeui_pyramid>
	        WSGIApplicationGroup %{ENV:APPLICATION_GROUP}
	        WSGIPassAuthorization On
	        WSGIProcessGroup scribeui_pyramid
	        Order deny,allow
	        Allow from all
	</Directory>

Once apache is restarted, ScribeUI should be available!
