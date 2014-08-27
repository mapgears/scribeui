import imp #For plugins
import sys
import traceback
import logging

import os #For plugins


log = logging.getLogger(__name__)

pluginsList = []

def includeme(config):
    global pluginsList
    plugins = load_plugins()
    for name, plugin in plugins.iteritems():
        config.include("..plugins."+name)
        pluginsList.append(name)

#===============================
#	Plugin load code
#===============================
def load_plugins():
    plugins = {}
    path = os.path.abspath(os.path.join("scribeui_pyramid", "modules", "plugins"))
    for filename in os.listdir(path):
        if os.path.isdir(os.path.join(path, filename)) and os.path.isfile(os.path.join(path, filename, '__init__.py')):
            try:
                f, pluginPath, descr = imp.find_module(filename, [path])
                pluginName = os.path.basename(pluginPath)
                plugins[pluginName] = imp.load_module(filename, f, pluginName, descr)
            except ImportError:
                log.error('There was an error with the '+filename+' plugin:')
                traceback.print_exc(file=sys.stdout)
    return plugins
