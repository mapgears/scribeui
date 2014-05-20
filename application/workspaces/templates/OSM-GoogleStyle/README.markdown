OSM Google style template
=======

OSM google style is a template for ScribeUI that gives a google inspired style to any OSM data.

Requirements
------
*   ScribeUI with all the demo data installed
*   PostgreSQL/PostGIS
*   OSM data to import

You can get the latest release of ScribeUI [here](https://github.com/mapgears/scribeui). To be sure all the demo data are downloaded and installed, you should run this command from the ScribeUI folder:

    sudo make load-demo-data

You can install PostgreSQL and PostGIS using aptitude:

    sudo apt-get install postgresql-9.1-postgis postgresql-server-dev-9.1


###Importing OSM data in PostGIS

####Create working directory

All the steps that follow assume that the data  will be installed in a directory called "osm-data" in your home directory 

    mkdir ~/osm-data
    cd ~/osm-data/

####Download OSM data

You can download data for your region of interest from http://download.geofabrik.de/ (up-to-date from OSM) or from http://downloads.cloudmade.com/ (2011 datas from OSM).
The rest of these instructions assume that we work with the data for the state of Rhode Island.

    cd ~/osm-data/
    wget http://download.geofabrik.de/north-america/us/rhode-island-latest.osm.bz2

####Install imposm, using virtualenv

Install dependencies and create python virtual env:

    cd ~/osm-data/
    sudo apt-get install build-essential python-dev protobuf-compiler \
                        libprotobuf-dev libtokyocabinet-dev python-psycopg2 \
                        libgeos-c1

    sudo apt-get install python-virtualenv
    virtualenv venv
    source venv/bin/activate

Install shapely speedups: (shapely 1.2.11 has bugs, do not use it)

    sudo apt-get install libgeos-dev
    pip install Shapely

Install imposm:

    pip install imposm

####Create database

    imposm-psqldb > create-db.sh
    vi ./create-db.sh # cross check if all path are set properly

    ... remove the following line:
    -------------------8<--------------
    createlang plpgsql osm
    ------------------->8--------------

    sudo su postgres
    sh ./create-db.sh
    exit
    sudo service postgresql restart

####Load data using imposm

    cd ~/osm-data/
    imposm --proj=EPSG:3857 --read rhode_island.osm.bz2
    imposm --proj=EPSG:3857 --write --database osm --host localhost --user osm --table-prefix osm_
    (... if prompted for db password, the default is osm)
    imposm  --optimize -d osm

*   Note: multiple .osm.pbf files can be loaded in separate commands using the --merge-cache argument.


Configuration
------

*    Log into your ScribeUI workspace.

*    Click on the "New Map" button in the "Manager" tab.

*    Fill the "Name" field, select the "Scribe" type then select the "OSM-GoogleStyle" template. Once finished, click on "Create".

*    Open the "Editor" tab.

*    Select the "Variable" file from the first drop down menu.

*    Make sure the connection information correspond to your PostGIS database.

*    If you used any other table prefix than "osm\_" you will have to change the prefix in all the "DATA" parameter of all layers. You can edit each layer files by selecting them from the second drop down menu. 
