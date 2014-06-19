---
title: ScribeUI - Getting started with ScribeUI
layout: default
---

Version Update and Workspace Migration
======================================

v0.5 to v1.0
------------

Before pulling and installing ScribeUI v1.0, first change all file's permission back to your own user:

    sudo chown -R user application/

You may now follow the production installation instructions and install ScribeUI v1.0

Once the installation is finished and  ScribeUI up, you may import your old workspaces changing the workspace folder and the database to your user:

    sudo chown -R user scribeui.sqlite workspaces/
 
Then executre the update script:

    python update.py

Then change the database and workspace folders back to www-data:

    sudo chown -R www-data scribeui.sqlite workspaces/

Your workspaces and maps will then be imported, although passwordless. 

Each map will have to be edited to delete or comment the following line in the map editor:

    CONFIG "MS_ERRORFILE" "../debugFile.log"


v0.1 to v0.2
------------

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
