from runserver.py import app as application

import sys

#Replace <path> with the path to application/runserver.py
#Example /opt/ScribeUI/application/runserver.py

sys.path.insert(0,'<path>')

WSGIScriptAlias /ScribeUI <path>
