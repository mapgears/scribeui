#!/usr/bin/python                      
# -*- coding: iso-8859-1 -*-

#import flask
import os, sys
path = os.path.abspath(os.path.dirname(__file__))
sys.path.append(path)
from init import app

#For localhost
if __name__ == '__main__':
    app.run()

#For a server
application = app
