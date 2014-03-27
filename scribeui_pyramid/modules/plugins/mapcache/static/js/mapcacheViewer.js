/*
	Mapcache viewer module.
	Role: Preview previously generated caches for a map.

	Note: This is not an independant plugin, meaning it relies on the main mapcache plugin for events and initialisation. 
*/
function mapcacheViewerManager(plugin){
	this.name = "Mapcache Plug-in Viewer Component";
	this.mapcachePlugin = plugin;
}
mapcacheViewerManager.prototype.onMapOpened = function(){
	// Add a viewer if it doesn't exist:
	if(typeof(workspace.openedMap.mapcacheViewer) == "undefined")
		workspace.openedMap.mapcacheViewer = new mapcacheViewer(workspace.openedMap);
	for(map in workspace.maps){
		if(typeof(map.mapcacheViewer) != "undefined")
			map.mapcacheViewer.deactivate();
	}
	workspace.openedMap.mapcacheViewer.activate();
};
function mapcacheViewer(map){
	this.layers = [];
	this.map = map;
	this.active = false;
}
mapcacheViewer.prototype.activate(){
	this.active = true;
}

mapcacheViewer.prototype.deactivate(){
	this.active = false;
}
