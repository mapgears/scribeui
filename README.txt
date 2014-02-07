ScribeUI Pyramid README
=======================

- cp development.ini local.ini

- edit the following parameters:
	- sqlalchemy.url
	- workspaces.directory
	- scribe.python
	- cgi.directory
	- mapserver.url

- Copy the elfinder-python directory in your cgi-bin directory

- Copy the proxy.cgi file in your cgi-bin directory

- make install

- make start

- In your web browser, access http://localhost:6543/