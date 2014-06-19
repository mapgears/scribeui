/*
	Mapcache viewer module.
	Role: Preview previously generated caches for a map.

	Note: This is not an independant plugin, meaning it relies on the main mapcache plugin for events and initialisation. 
*/
function mapcacheViewer(map){
	this.layers = [];
	this.map = map;
	this.active = false;
	this.layerSwitcher = new OpenLayers.Control.LayerSwitcher();
}
mapcacheViewerManager = function(plugin){
	this.name = "Viewer manager"
	this.plugin = plugin;
}
mapcacheViewerManager.prototype.onMapOpened = function(){
	workspace.openedMap.mapcacheViewer = new mapcacheViewer(workspace.openedMap);
	workspace.openedMap.mapcacheViewer.activate();
};
mapcacheViewerManager.prototype.onMapClosed = function(){
	//Disable all layerswitchers
	for(i in workspace.maps){
		if(typeof(workspace.maps[i].mapcacheViewer) != "undefined")
			workspace.maps[i].mapcacheViewer.deactivate();
	}
}

mapcacheViewer.prototype.updateLayers = function(){
	$.ajax({
            url: $API + "/mapcache/getlayers?map="+this.map.id,
            context: this,
            dataType: "json"
        }).done(function(data){
			if(data.errors.length == 0){
                origin = new OpenLayers.LonLat(workspace.openedMap.OLMap.layers[0].maxExtent.bottom, workspace.openedMap.OLMap.layers[0].maxExtent.left);
				for(i in data.layers){
					// Create the layers
					var layer = new OpenLayers.Layer.TMS(
						data.layernames[i], // name for display in LayerSwitcher
						$API + "/mapcache/tiles?map="+this.map.id+"&job="+data.layers[i]+"&request=", 
						{layername: data.layernames[i], type: "png", tileOrigin:origin} 
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
		this.map.OLMap.removeLayer(this.layers[i]);
	}
}
mapcacheViewer.prototype.addLayers = function(){
	for(i in this.layers){
		this.map.OLMap.addLayer(this.layers[i]);
	}
}
mapcacheViewer.prototype.activate = function(){
	this.active = true;
	this.map.OLMap.addControl(this.layerSwitcher);
	this.layerSwitcher.activate();
	this.updateLayers();
}

mapcacheViewer.prototype.deactivate = function(){
	this.active = false;
}
