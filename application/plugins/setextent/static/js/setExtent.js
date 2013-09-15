jQuery(function() { $(document).ready(function(){

	function setExtent(){
		this.name = "Map Extent Plug-in";
	}
	//This will be called immediatly after the addPlugin function
	setExtent.prototype.init = function(){
		addButton("Set Map Extent", "#editor-toolbar",{
			onclick: this.open,	
			buttonid: 'setMapExtent'
		});
		$('#setMapExtent').button('disable');
	}

	setExtent.prototype.open = function(){
		//Find the extent in the mapEditor
		line = -1;
		for(var i=0; i<mapEditor.lineCount(); i++){
			if(mapEditor.getLine(i).indexOf("EXTENT:") !== -1){
				//Hightlight line in codemirror
				 mapEditor.setLineClass(i, 'background', 'setextent-highlighted-line');
				line = i;
				break;
			}
		}
		if(line === -1) return "Couldn't find map extent.";
		
		//We need a vector layer to draw the box
		var boxLayer = new OpenLayers.Layer.Vector("Box layer");
		_workspace.openedMap.OLMap.addLayer(boxLayer); 

		//Add drawing control to map
		var boxControl = new OpenLayers.Control.DrawFeature(boxLayer,
			OpenLayers.Handler.RegularPolygon, {
				handlerOptions: {
					sides: 4,
					irregular: true
				}
			}
		);
		boxLayer.events.register('beforefeatureadded',this, function(e){
			boxLayer.removeAllFeatures();
		});
		boxLayer.events.register('featureadded',this, function(e){
			$(".ui-dialog-buttonpane button:contains('SetExtent')").button("enable");
		});
		_workspace.openedMap.OLMap.addControl(boxControl); 
		boxControl.activate();

		//Create the dialog
		var dialogDiv = $('<div id="setextent-dialog"><p>Draw a rectangle on the map to choose the map extent.</p></div>')
		dialogDiv.hide();
		$('.main').append(dialogDiv);
		dialogDiv.dialog({
			autoOpen: false,
			resizable: false,
			height: "130",
			width: "180",
   		    modal: false,
   		    buttons: {
				"SetExtent": function(){
					//Get extent string
					var ext = boxLayer.features[0].geometry.bounds.toString();
					ext = ext.replace(/,/g,' ');
					var lineContent = mapEditor.getLine(line);
					var newLineContent = lineContent.substr(0, lineContent.indexOf("EXTENT:")+7);
					newLineContent += ext;
					mapEditor.setLine(line, newLineContent);
					
				 	mapEditor.setLineClass(i, 'background', '');
					_workspace.openedMap.OLMap.removeControl(boxControl);
					boxControl.destroy();
					_workspace.openedMap.OLMap.removeLayer(boxLayer);
					boxLayer.destroy();
					$(this).dialog("close");
				},
				"Cancel": function(){
				 	mapEditor.setLineClass(i, 'background', '');
					_workspace.openedMap.OLMap.removeControl(boxControl);
					boxControl.destroy();
					_workspace.openedMap.OLMap.removeLayer(boxLayer);
					boxLayer.destroy();
					$(this).dialog("close");
				}
			}
		 }).dialog("open");
		//We keep the button disabled until the user draws a box
		$(".ui-dialog-buttonpane button:contains('SetExtent')").button("disable");

		//Open the map tab if it isn't opened already
		openSecondaryPanel("maps", mapEditor);
				
	}
        //This will be called by functions.js once the map is opened.
        //There exists also a onWorkspaceOpened function
	setExtent.prototype.onMapOpened = function(){
		$('#setMapExtent').button('enable');
	}
	//Call this to add your plugin to the application. 
	addPlugin(new setExtent())
})})
