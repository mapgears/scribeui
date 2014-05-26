# Makefile to help automate tasks in scribeui_pyramid
WD := $(shell pwd)
GIT := git
PY := bin/python
PIP := bin/pip
NOSE := bin/nosetests
PIP_MIR = PIP_FIND_LINKS='http://mypi http://simple.crate.io/'
PSERVE := bin/pserve

EV_INI := local.ini

.PHONY: all
all: deps develop ev.db db_up db_data

.PHONY: clean_all
clean_all: clean_wd clean_venv

clean_wd:
	rm -rf data *.egg-info

install: all

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
deps: venv
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
venv: bin/python
bin/python:
	virtualenv --no-site-packages .

.PHONY: clean_venv
clean_venv:
	rm -rf lib include local bin share

.PHONY: clean_wd run start start_app stop stop_app restart restart_app branch-develop
