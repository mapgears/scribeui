from runserver.py import app as application

import sys

sys.path.insert(0,'/opt/apps/ScribeUI/application/runserver.py')

WSGIScriptAlias /ScribeUI /opt/apps/ScribeUI/application/runserver.py