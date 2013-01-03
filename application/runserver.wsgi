from runserver.py import app as application

import sys

sys.path.insert(0,'/opt/MapX/application/runserver.py')

WSGIScriptAlias /mapx /opt/MapX/application/runserver.py