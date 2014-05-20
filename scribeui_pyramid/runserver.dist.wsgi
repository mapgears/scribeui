from runserver.py import app as application

import sys

#Replace <scribeui_path> with the path to the root of your scribeui installation
#Example: /opt/ScribeUI/application/runserver.py

sys.path.insert(0,'<scribeui_path>/application/runserver.py')

WSGIScriptAlias /ScribeUI <scribeui_path>/application/runserver.py
