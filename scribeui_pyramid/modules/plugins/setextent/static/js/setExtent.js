jQuery(function() { $(document).ready(function(){

	function setExtent(){
		this.name = "Map Extent Plug-in";
		this.boxControl = null;
		this.boxLayer = null;
		this.dialogDiv = null;
		this.extentLineNumber = null;
	}
	//This will be called immediatly after the addPlugin function
	setExtent.prototype.init = function(){
		ScribeUI.UI.addButton("Set Map Extent", "#editor-toolbar",{
			onclick: $.proxy(this.open,this),	
			buttonid: 'setMapExtent'
		});
		$('#setMapExtent').button('disable');
	}

	setExtent.prototype.open = function(){
		//Find the extent in the editors['maps']
		var extentStr = "EXTENT ";
		if(ScribeUI.workspace.openedMap.type == "Scribe")
			extentStr = "EXTENT:";
		for(var i=0; i < ScribeUI.editorManager.get('map').CMEditor.lineCount(); i++){
			if(ScribeUI.editorManager.get('map').CMEditor.getLine(i).indexOf(extentStr) !== -1){
				//Hightlight line in codemirror
				ScribeUI.editorManager.get('map').CMEditor.addLineClass(i, 'background', 'setextent-highlighted-line');
				this.extentLineNumber = i;
				break;
			}
		}
		if(this.extentLineNumber === -1) return "Couldn't find map extent.";
		var extProxyLineNumber = this.extentLineNumber;
		
		//We need a vector layer to draw the box
		boxLayer = new OpenLayers.Layer.Vector("Box layer");
		ScribeUI.workspace.openedMap.OLMap.addLayer(boxLayer); 

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
		ScribeUI.workspace.openedMap.OLMap.addControl(boxControl); 
		boxControl.activate();

		//Create the dialog
		dialogDiv = $('<div id="setextent-dialog"><p>Draw a rectangle on the map to choose the map extent.</p></div>')
		dialogDiv.hide();
		$('.main').append(dialogDiv);
		dialogDiv.dialog({
			autoOpen: false,
			resizable: false,
			height: "130",
			width: "auto",
   		    modal: false,
			beforeClose: $.proxy(this.closeDialog, this),
   		    buttons: {
				"SetExtent": function(){
					//Get extent string
					var ext = boxLayer.features[0].geometry.bounds.toString();
					ext = ext.replace(/,/g,' ');
					var lineContent = ScribeUI.editorManager.get('map').CMEditor.getLine(extProxyLineNumber);
					var newLineContent = lineContent.substr(0, lineContent.indexOf(extentStr)+extentStr.length);
					newLineContent += ext;
					ScribeUI.editorManager.get('map').CMEditor.replaceRange(newLineContent, 
						{"line": extProxyLineNumber, "ch": 0}, 
						{"line": extProxyLineNumber, "ch": lineContent.length - 1});
					
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
		ScribeUI.UI.openSecondaryPanel(ScribeUI.editorManager.get('map'));
				
	}
	
    //This will be called by functions.js once the map is opened.
	setExtent.prototype.onMapOpened = function(){
		$('#setMapExtent').button('enable');
	}
	setExtent.prototype.closeDialog = function(e, ui){
		ScribeUI.editorManager.get('map').CMEditor.removeLineClass(this.extentLineNumber, 'background', 'setextent-highlighted-line');
		ScribeUI.workspace.openedMap.OLMap.removeControl(boxControl);
		boxControl.destroy();
		ScribeUI.workspace.openedMap.OLMap.removeLayer(boxLayer);
		boxLayer.destroy();
	}

	//Call this to add your plugin to the application. 
	ScribeUI.addPlugin(new setExtent())
})})
