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
	for(i in workspace.maps){
		if(typeof(workspace.maps[i].mapcacheViewer) != "undefined")
			workspace.maps[i].mapcacheViewer.deactivate();
	}
	workspace.openedMap.mapcacheViewer.activate();
};
function mapcacheViewer(map){
	this.layers = [];
	this.map = map;
	this.active = false;
	this.layerSwitcher = new OpenLayers.Control.LayerSwitcher();
}
mapcacheViewer.prototype.updateLayers = function(){
	$.ajax({
            url: $API + "/mapcache/getlayers?map="+this.map.id,
            context: this,
            dataType: "json"
        }).done(function(data){
			if(data.errors.length == 0){
				for(i in data.layers){
					// Create the layers
					var layer = new OpenLayers.Layer.TMS(
						data.layers[i], // name for display in LayerSwitcher
						$API + "/mapcache/tiles?map="+this.map.id+"&job="+data.layers[i], // service endpoint
						{layername: data.layers[i], type: "png"} // required properties
					);
					layer.setVisibility(false); /* Hidden by default */
					this.layers.push(layer);
					this.addLayers();
				}
			}
        });

}
mapcacheViewer.prototype.destroyLayers = function(){
	for(i in this.layers){
		this.map.OLMap.emoveLayer(this.layers[i]);
	}
}
mapcacheViewer.prototype.addLayers = function(){
	for(i in this.layers){
		this.map.OLMap.addLayer(this.layers[i]);
	}
}
mapcacheViewer.prototype.activate = function(){
	this.active = true;
	this.updateLayers();
	this.map.OLMap.addControl(this.layerSwitcher);
	this.layerSwitcher.activate();
}

mapcacheViewer.prototype.deactivate = function(){
	this.active = false;
}
