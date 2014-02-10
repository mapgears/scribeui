jQuery(function() { $(document).ready(function(){

	function setExtent(){
		this.name = "Map Extent Plug-in";
		this.boxControl = null;
		this.boxLayer = null;
		this.dialogDiv = null;
		this.extentLineNumer = null;
	}
	//This will be called immediatly after the addPlugin function
	setExtent.prototype.init = function(){
		addButton("Set Map Extent", "#editor-toolbar",{
			onclick: $.proxy(this.open,this),	
			buttonid: 'setMapExtent'
		});
		$('#setMapExtent').button('disable');
	}

	setExtent.prototype.open = function(){
		//Find the extent in the editors['maps']
		var extentStr = "EXTENT ";
		if(workspace.openedMap.type == "Scribe")
			extentStr = "EXTENT:";
		for(var i=0; i < editors['maps'].lineCount(); i++){
			if(editors['maps'].getLine(i).indexOf(extentStr) !== -1){
				//Hightlight line in codemirror
				editors['maps'].setLineClass(i, 'background', 'setextent-highlighted-line');
				this.extentLineNumer = i;
				break;
			}
		}
		if(this.extentLineNumer === -1) return "Couldn't find map extent.";
		var extProxyLineNumber = this.extentLineNumer;
		
		//We need a vector layer to draw the box
		boxLayer = new OpenLayers.Layer.Vector("Box layer");
		workspace.openedMap.OLMap.addLayer(boxLayer); 

		//Add drawing control to map
		boxControl = new OpenLayers.Control.DrawFeature(boxLayer,
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
		workspace.openedMap.OLMap.addControl(boxControl); 
		boxControl.activate();

		//Create the dialog
		dialogDiv = $('<div id="setextent-dialog"><p>Draw a rectangle on the map to choose the map extent.</p></div>')
		dialogDiv.hide();
		$('.main').append(dialogDiv);
		dialogDiv.dialog({
			autoOpen: false,
			resizable: false,
			height: "130",
			width: "180",
   		    modal: false,
			beforeClose: $.proxy(this.closeDialog, this),
   		    buttons: {
				"SetExtent": function(){
					//Get extent string
					var ext = boxLayer.features[0].geometry.bounds.toString();
					ext = ext.replace(/,/g,' ');
					var lineContent = editors['maps'].getLine(extProxyLineNumber);
					var newLineContent = lineContent.substr(0, lineContent.indexOf(extentStr)+extentStr.length);
					newLineContent += ext;
					editors['maps'].setLine(extProxyLineNumber, newLineContent);
					
					$(this).dialog("close");
				},
				"Cancel": function(){
					$(this).dialog("close");
				}
			}
		 }).dialog("open");
		//We keep the button disabled until the user draws a box
		$(".ui-dialog-buttonpane button:contains('SetExtent')").button("disable");

		//Open the map tab if it isn't opened already
		openSecondaryPanel("maps", editors['maps']);
				
	}
        //This will be called by functions.js once the map is opened.
        //There exists also a onWorkspaceOpened function
	setExtent.prototype.onMapOpened = function(){
		$('#setMapExtent').button('enable');
	}
	setExtent.prototype.closeDialog = function(e, ui){
		editors['maps'].setLineClass(this.extentLineNumer, 'background', '');
		workspace.openedMap.OLMap.removeControl(boxControl);
		boxControl.destroy();
		workspace.openedMap.OLMap.removeLayer(boxLayer);
		boxLayer.destroy();
	}

	//Call this to add your plugin to the application. 
	addPlugin(new setExtent())
})})
