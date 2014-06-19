# Makefile to help automate tasks in scribeui_pyramid
WD := $(shell pwd)
GIT := git
PY := bin/python
PIP := bin/pip
NOSE := bin/nosetests
PIP_MIR = PIP_FIND_LINKS='http://mypi http://simple.crate.io/'
PSERVE := bin/pserve

EV_INI := local.ini

.PHONY: admin
admin: dep_install deps mv-elfinder 

.PHONY: clean_all
clean_all: clean_wd clean_venv

clean_wd:
	rm -rf data *.egg-info

install: deps develop ev.db db_up db_data 

develop: lib/python*/site-packages/ev.egg-link
lib/python*/site-packages/ev.egg-link:
	$(PY) setup.py develop

branch-develop:
	$(GIT) checkout develop

# database
ev.db:
	bin/alembic -c $(EV_INI) upgrade head

.PHONY: db_up
db_up:
	bin/alembic  -c $(EV_INI) upgrade head

.PHONY: db_down
db_down:
	bin/alembic  -c $(EV_INI) downgrade -1

.PHONY: db_clean
db_clean:
	bin/alembic  -c $(EV_INI) downgrade base

# make db_new desc="This is a new migration"
.PHONY: db_new
db_new: ev.db
	bin/alembic -c $(EV_INI) revision --autogenerate -m "$(desc)"

.PHONY: db_version
db_version:
	bin/alembic -c $(EV_INI) current

.PHONY: db_data
db_data: ev.db
	bin/load_ev_data $(EV_INI)

.PHONY: db_reset
db_reset: stop
	bin/alembic  -c $(EV_INI) downgrade base
	bin/alembic  -c $(EV_INI) upgrade head
	bin/load_ev_data $(EV_INI)

# DEPS

.PHONY: deps
deps:  venv dep_requirements


dep_install:
	apt-get install build-essential swig libpq-dev python-dev libmysqlclient-dev python-pip libmysqlclient-dev zip
	pip install virtualenv

dep_requirements:
	@echo "\n\nSilently installing packages (this will take a while)..."
	$(PIP_MIR) $(PIP) install -q -r requirements.txt

# Run the application

run: start
start: start_app

start_app:
	@[ -f paster.pid ] && echo "Application is already started" || true
	@[ ! -f paster.pid ] && echo "Starting application in background. Logfile is paster.log" || true
	@[ ! -f paster.pid ] && $(PSERVE) --reload --pid-file=paster.pid --log-file=paster.log $(EV_INI) 1>/dev/null &

stop: stop_app

stop_app:
	@[ ! -f paster.pid ] && echo "Application is not started" || echo "Killed pid `cat paster.pid`"
	@[ -f paster.pid ] && kill -9 `cat paster.pid` || true
	@[ -f paster.pid ] && rm paster.pid || true
	@[ -f paster.log ] && rm paster.log || true

restart: restart_app

restart_app: stop_app start_app

# INSTALL
#
# Helpers to install and setup EV
# We need a virtualenv
mv-elfinder:
	sudo cp -ap elfinder-python /usr/lib/cgi-bin/
	sudo chown -R www-data /usr/lib/cgi-bin/elfinder-python/
	sudo cp proxy.cgi /usr/lib/cgi-bin/

perms:
	sudo chown -R www-data scribeui_pyramid scribeui.sqlite workspaces 
	sudo chown www-data .

venv: bin/python
bin/python:
	virtualenv --no-site-packages .

.PHONY: clean_venv
clean_venv:
	rm -rf lib include local bin share

.PHONY: clean_wd run start start_app stop stop_app restart restart_app branch-develop

# LOAD DATA
load-all-data: load-basescribe-data load-demo-data

load-demo-data:
	mkdir -p ./application/data/natural_earth

	test -d ./application/data/natural_earth/110m_cultural/ || (wget -c http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/110m/cultural/110m_cultural.zip && unzip -o 110m_cultural.zip -d ./application/data/natural_earth/110m_cultural/ && rm 110m_cultural.zip)

	test -d ./application/data/natural_earth/110m_physical/ || (wget -c http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/110m/physical/110m_physical.zip && unzip -o 110m_physical.zip -d ./application/data/natural_earth/110m_physical/ && rm 110m_physical.zip)

	test -d ./application/data/natural_earth/10m_cultural/ || (wget -c http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/cultural/10m_cultural.zip && unzip -o 10m_cultural.zip -d ./application/data/natural_earth/10m_cultural/ && rm 10m_cultural.zip)

	test -d ./application/data/natural_earth/10m_physical/ || (wget -c http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/physical/10m_physical.zip &&unzip -o 10m_physical.zip -d ./application/data/natural_earth/10m_physical/ && rm 10m_physical.zip)

	test -d ./application/data/natural_earth/50m_cultural/ || (wget -c http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/50m/cultural/50m_cultural.zip && unzip -o 50m_cultural.zip -d ./application/data/natural_earth/50m_cultural/ && rm 50m_cultural.zip)

	test -d ./application/data/natural_earth/50m_physical/ || (wget -c http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/50m/physical/50m_physical.zip && unzip -o 50m_physical.zip -d ./application/data/natural_earth/50m_physical/ && rm 50m_physical.zip)

	mkdir -p ./application/data/osm-data

	test -f ./application/data/osm-data/processed_p.shp || (wget -c http://tile.openstreetmap.org/processed_p.tar.bz2 && tar -C ./application/data/osm-data/ -xjf processed_p.tar.bz2  && rm processed_p.tar.bz2)

	test -f ./application/data/osm-data/shoreline_300.shp || (wget -c http://tile.openstreetmap.org/shoreline_300.tar.bz2 && tar -C ./application/data/osm-data/ -xjf shoreline_300.tar.bz2  && rm shoreline_300.tar.bz2)

	test -f ./application/data/osm-data/TM_WORLD_BORDERS-0.3.shp || (wget -c http://thematicmapping.org/downloads/TM_WORLD_BORDERS-0.3.zip && unzip -o TM_WORLD_BORDERS-0.3.zip -d ./application/data/osm-data/ && rm TM_WORLD_BORDERS-0.3.zip)

load-basescribe-data:
	mkdir -p ./application/data/natural_earth

	test -d ./application/data/natural_earth/110m_physical/ || (wget -c http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/110m/physical/ne_110m_land.zip && unzip -o ne_110m_land.zip -d ./application/data/natural_earth/110m_physical/ && rm ne_110m_land.zip)

	test -d ./application/data/natural_earth/50m_physical/ || (wget -c http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/50m/physical/ne_50m_land.zip && unzip -o ne_50m_land.zip -d ./application/data/natural_earth/50m_physical/ && rm ne_50m_land.zip)

	test -d ./application/data/natural_earth/10m_physical/ || (wget -c http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/10m/physical/ne_10m_land.zip &&unzip -o ne_10m_land.zip -d ./application/data/natural_earth/10m_physical/ && rm ne_10m_land.zip)
