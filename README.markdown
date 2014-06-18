ScribeUI
=========

ScribeUI is an application to create mapfiles with many scale levels.

To get the latest **release**, clone this repo and then checkout the latest tag. ``` git describe --abbrev=0 ``` to view the latest tag.

The following instruction installations were tested on ubuntu precise. 


**Requirements**

* Mapserver 6.4.1
* Apache 2.2
* Make

Production installation
------------

You need to install apache2 with mod_wsgi: 

    sudo apt-get install libapache2-mod-wsgi 

**Note** mod_wsgi 3.4 or more is recommended. [How to compile mod_wsgi 3.4 on ubuntu precise](http://scribeui.org/faq.html#wsgi-how)


Configuration
-------------

First, clone the repository in a folder www-data will be able to access. In this configuration example, the scribeui folder will be located at ```/opt/scribeui```

Then, copy the default production settings:
 
    cp production.ini local.ini

Review the following parameters in local.ini, and edit them if needed:
	- sqlalchemy.url
	- workspaces.directory
	- scribe.python
	- cgi.directory
	- mapserver.url

Edit the proxy.cgi file and add your server host to the list of allowed hosts if different from localhost (localhost is already included.)

You can use the Makefile to automatically setup ScribeUI for you, simply run:

       sudo make
       make install


Create a file 'pyramid.wsgi' with the following content, editing the path to your scribeui installation:

	from pyramid.paster import get_app, setup_logging
	ini_path = '/opt/scribeui/local.ini'
	setup_logging(ini_path)
	application = get_app(ini_path, 'main')

Next step is adding the app to apache, here is an example configuration:

    WSGIDaemonProcess scribeui user=www-data group=www-data threads=10 \
	        python-path=/opt/scribeui/lib/python2.7/site-packages
	WSGIScriptAlias /scribeui /opt/scribeui/pyramid.wsgi

	<Directory /opt/scribeui>
	        WSGIApplicationGroup %{ENV:APPLICATION_GROUP}
	        WSGIPassAuthorization On
	        WSGIProcessGroup scribeui
	        Order deny,allow
	        Allow from all
	</Directory>

Once apache is restarted, ScribeUI should be available!

    sudo service apache2 restart

Downloading template data is optional, but recommended for a better 
experience. 

        sudo make load-demo-data   


Development installation
------------

These instructions are for running a development version of ScribeUI. It is pretty good for a local version of the application. Production installation instructions are available below.

    cp development.ini local.ini

Review the following parameters in local.ini, and edit them if needed:

	- sqlalchemy.url
	- workspaces.directory
	- scribe.python
	- cgi.directory
	- mapserver.url

Edit the proxy.cgi file and add your server host to the list of allowed hosts if different from localhost (localhost is already included.)

You can use the Makefile to automatically setup ScribeUI for you, simply run:

        sudo make
        make install

This will download and install the required dependencies, setup the differents
configurations files and install them in the proper directories. 

To launch the server at http://localhost:6543/:

        make start

Downloading template data is optional, but recommended for a better 
experience. 

        sudo make load-demo-data   


This will download some natural earth data and will help you get started with
ScribeUI by making templates readily working so you don't start with an empty
mapfile. (The template code is still available if you don't download the data,
but the result will be pink tiles). 


