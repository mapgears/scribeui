---
title: ScribeUI - Getting started with ScribeUI
layout: default
---

#Version Update and Workspace Migration

These instructions are for users who have ScribeUI **v0.1** installed. If 
you have a later version and wish to update ScribeUI, just pull the latest
version from github and you're all good! 

In version 0.2 of ScribeUI, workspace management was edited, which is why
you need to migrate your workspace and maps if you made them in ScribeUI o.1. 
Just follow these steps:

* Change the owner of the database and workspace folders back to yourself:

        sudo chown -R yourusername application/db application/workspaces 

* Checkout the latest release of ScribeUI

        git checkout tags/v0.4

* Run the update script:

        python application/update.py 

* Change the owner of the database and workspace back to www-data:

        sudo chown -R www-data application/db application/workspaces 

* (optionnal) Restart apache:

        sudo /etc/init.d/apache2 restart

* The first time you edit a map, add the following line to the map element:

        INCLUDE: '../symbols.map' 

NOTE: If you choose not to restart apache, the new version of ScribeUI might take
a while to go live because of mod\_wsgi.
