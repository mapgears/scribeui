ScribeUI Pyramid README
=======================

Development
-----------

- cp development.ini local.ini

- edit the following parameters in local.ini:
	- sqlalchemy.url
	- workspaces.directory
	- scribe.python
	- cgi.directory
	- mapserver.url

- Copy the elfinder-python directory in your cgi-bin directory

- Copy the proxy.cgi file in your cgi-bin directory

  - Edit the proxy.cgi file and add your server host to the list of allowed hosts

- sudo apt-get install build-essential swig libpq-dev python-dev sudo apt-get install libmysqlclient-dev sudo apt-get install python-pip sudo pip install virtualenv libmysqlclient-dev

- make install

- make start

- In your web browser, access http://localhost:6543/


Production
----------

- edit the following parameters in production.ini:
	- sqlalchemy.url
	- workspaces.directory
	- scribe.python
	- cgi.directory
	- mapserver.url

- Copy the elfinder-python directory in your cgi-bin directory

- Copy the proxy.cgi file in your cgi-bin directory

  - Edit the proxy.cgi file and add your server host to the list of allowed hosts

- sudo apt-get install build-essential swig libpq-dev python-dev sudo apt-get install libmysqlclient-dev sudo apt-get install python-pip sudo pip install virtualenv

- make install

- Make sure www-data is the owner of the root directory, the database file (.sqlite) and the workspaces directory

- Create a file 'pyramid.wsgi' with the following content:

	from pyramid.paster import get_app, setup_logging
	ini_path = '/opt/scribeui_pyramid/scribeui_pyramid/production.ini'
	setup_logging(ini_path)
	application = get_app(ini_path, 'main')

- cd /etc/apache2/sites-available

- Create a file 'scribeui_pyramid' with the following content:

	WSGIDaemonProcess scribeui_pyramid user=www-data group=www-data threads=10 \
	        python-path=/opt/scribeui_pyramid/scribeui_pyramid/lib/python2.7/site-packages
	WSGIScriptAlias /scribeui_pyramid /opt/scribeui_pyramid/scribeui_pyramid/pyramid.wsgi

	<Directory /opt/scribeui_pyramid/scribeui_pyramid>
	        WSGIApplicationGroup %{ENV:APPLICATION_GROUP}
	        WSGIPassAuthorization On
	        WSGIProcessGroup scribeui_pyramid
	        Order deny,allow
	        Allow from all
	</Directory>

- cd ../sites-enabled

- sudo ln -s ../sites-available/scribeui_pyramid

- sudo /etc/init.d/apache2 restart

