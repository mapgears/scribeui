plugins.push(setExtent)

function setExtent(){
	this.name = "Map Extent Plug-in";
}

setExtent.prototype.init = function(){
	addButton("Set Map Extent", "#editor-toolbar",{
		onclick: this.open,	
		buttonid: 'setMapExtent'
	});
}

setExtent.prototype.open = function(){
	alert('Test');
}
