SCRIBE_PATH:= $(shell pwd)
SCRIBE_PATH_CLEAN:= $(subst /,\/,$(SCRIBE_PATH))
HOSTNAME:= $(shell hostname)

#default: download_naturalearth_template_data
default: setup init_db

setup:

	cp application/runserver.dist.wsgi application/runserver.wsgi
	# Set the current path on scribe
	sed -i -e 's/<scribeui_path>/$(SCRIBE_PATH_CLEAN)/g' application/runserver.wsgi

	cp config.dist.py config.py
	# set the hostname of the machine
	sed -i -e 's/<hostname_or_ip>/$(HOSTNAME)/g' config.py
	
	cp ScribeUI.conf.example ScribeUI.conf
	sed -i -e 's/<path_to_scribeui_root>/$(SCRIBE_PATH_CLEAN)/g' ScribeUI.conf

download_deps:
	apt-get install -y apache2 libapache2-mod-wsgi cgi-mapserver sqlite3 python-pip \
		gcc python-all-dev
	pip install flask

init_db:
	( cd application; chmod +x init_db.py; python init_db.py )

install:

	# Move elfinder
	sudo cp -ap elfinder-python /usr/lib/cgi-bin/

	# Change folder owner to www-data
	sudo chown -R www-data application/db/ application/workspaces \
		application/www /usr/lib/cgi-bin/elfinder-python/

	sudo cp ScribeUI.conf /etc/apache2/sites-enabled/ScribeUI.conf

	sudo service apache2 reload

load-demo-data:
	mkdir -p ./application/data/naturalEarth

	test -d ./application/data/naturalEarth/110m_cultural/ || (wget -c http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/110m/cultural/110m_cultural.zip && unzip -o 110m_cultural.zip -d ./application/data/naturalEarth/110m_cultural/ && rm 110m_cultural.zip)

	test -d ./application/data/naturalEarth/110m_physical/ || (wget -c http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/110m/physical/110m_physical.zip && unzip -o 110m_physical.zip -d ./application/data/naturalEarth/110m_physical/ && rm 110m_physical.zip)

	test -d ./application/data/naturalEarth/10m_cultural/ || (wget -c http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/cultural/10m_cultural.zip && unzip -o 10m_cultural.zip -d ./application/data/naturalEarth/10m_cultural/ && rm 10m_cultural.zip)

	test -d ./application/data/naturalEarth/10m_physical/ || (wget -c http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/physical/10m_physical.zip &&unzip -o 10m_physical.zip -d ./application/data/naturalEarth/10m_physical/ && rm 10m_physical.zip)

	test -d ./application/data/naturalEarth/50m_cultural/ || (wget -c http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/50m/cultural/50m_cultural.zip && unzip -o 50m_cultural.zip -d ./application/data/naturalEarth/50m_cultural/ && rm 50m_cultural.zip)

	test -d ./application/naturalEarth/50m_physical/ || (wget -c http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/50m/physical/50m_physical.zip && unzip -o 50m_physical.zip -d ./application/data/naturalEarth/50m_physical/ && rm 50m_physical.zip)
	
	rm *.zip
