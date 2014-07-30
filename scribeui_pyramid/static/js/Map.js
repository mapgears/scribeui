 ScribeUI.Map = function(options){
    this.id = null;
    this.name = null;
    this.url = null;
    this.thumbnail = null;
    this.workspace = null;
    this.type = "Scribe";
    this.template = null;
    this.templateLocation = "";
    this.locationPassword = "";
    this.description = "";
    this.OLMap = null;
    this.WMSLayer = null;
    this.saved = true;
    this.previousGroup = null;
    this.removedGroups = [];
    this.newGroups = [];
    this.updatedGroups = [];
    this.pois = [];

    if(options){
        this.id = options.id ? options.id : this.id;
        this.name = options.name ? options.name : this.name;
        this.url = options.url ? options.url : this.url;
        this.git_url = options.git_url ? options.git_url : this.git_url;
        this.thumbnail_url = options.thumbnail_url ? options.thumbnail_url : this.thumbnail_url;
        this.workspace = options.workspace ? options.workspace : null;
        this.type = options.type ? options.type : this.template;
        this.template = options.template ? options.template : this.template;
        this.templateLocation = options.templateLocation ? options.templateLocation : this.templateLocation;
        this.locationPassword = options.locationPassword ? options.locationPassword : this.locationPassword;
        this.description = options.description ? options.description : this.description;
        this.OLMap = options.OLMap ? options.OLMap : this.OLMap;
        this.WMSLayer = options.WMSLayer ? options.WMSLayer : this.WMSLayer;
        this.pois = options.pois ? options.pois : this.pois;
    }
}

ScribeUI.Map.prototype.open = function(callback){
    var self = this;

    $.post($API + '/maps/open/' + this.id, {}, 
        function(response) {
            if(response.status == 1){
                if(self.workspace.openedMap){
                    self.workspace.openedMap.close();
                }
                
                self.workspace.openedMap = self;

                $.each(response.data, function(key, value){
                    self[key] = value;
                });

                var pois = [];
                $.each(self.pois, function(index, poi){
                    oPoi = new ScribeUI.POI(
                        poi.name, 
                        poi.lon, 
                        poi.lat, 
                        poi.scale, 
                        poi.projection
                    );
                    oPoi.map = self;
                    pois.push(oPoi);

                    var option = $('<option>').val(poi.name).text(poi.name);
                    ScribeUI.UI.poi.select().append(option); 
                });
                self.pois = pois;
                ScribeUI.UI.poi.select().trigger('chosen:updated');

                self.previousGroup = null;

                self.displayComponents();

                self.display();

                self.saved = true;

                $("#map-name").text(self.name);
            }
        }
    );
};

ScribeUI.Map.prototype.getGroupByName = function(name){
    for(var i = 0; i < this.groups.length; i++){
        if(this.groups[i].name == name){
            return this.groups[i];
        }
    }
    return null;
};

ScribeUI.Map.prototype.getGroupIndexByName = function(name){
    for(var i = 0; i < this.groups.length; i++){
        if(this.groups[i].name == name){
            return i;
            break;
        }
    }
    return null;
};

ScribeUI.Map.prototype.removeGroup = function(name){
    var index = this.getGroupIndexByName(name);
    this.groups.splice(index, 1);
};

ScribeUI.Map.prototype.displayComponents = function(){
    ScribeUI.editorManager.get('map').CMEditor.setValue(this.map == null ? '' : this.map);
    ScribeUI.editorManager.get('scales').CMEditor.setValue(this.scales == null ? '' : this.scales);
    ScribeUI.editorManager.get('variables').CMEditor.setValue(this.variables == null ? '' : this.variables);
    ScribeUI.editorManager.get('symbols').CMEditor.setValue(this.symbols == null ? '' : this.symbols);
    ScribeUI.editorManager.get('fonts').CMEditor.setValue(this.fonts == null ? '' : this.fonts);
    ScribeUI.editorManager.get('projections').CMEditor.setValue(this.projections == null ? '' : this.projections);
    ScribeUI.editorManager.get('readme').CMEditor.setValue(this.readme == null ? '' : this.readme);

    ScribeUI.UI.editor.editorSelect().change(function(e){
        ScribeUI.UI.openSecondaryPanel(ScribeUI.editorManager.get($(this).val()));
    });

    ScribeUI.UI.logs.logs().find('textarea').val('');

    $.each(ScribeUI.editorManager.editors, function(key, editor){
        editor.CMEditor.clearHistory();
    });

    
    ScribeUI.UI.editor.toolbar().find('button').button('enable');
    ScribeUI.UI.poi.actions().find('button').button('enable');

    this.displayGroups();
};

ScribeUI.Map.prototype.displayGroups = function(silent){
    var self = this;
    var changeSelected = true;

    $.each(this.groups, function(index, group){
        var option = $('<option>').val(group.name).text(group.name);
        if(self.selectedGroup && group.name == self.selectedGroup.name){
            option.attr('selected', 'selected');
            changeSelected = false; 
        }
        ScribeUI.UI.editor.groupSelect().append(option);    
    });
    ScribeUI.UI.editor.groupSelect().trigger("chosen:updated");

    ScribeUI.UI.editor.groupSelect().change(function(e){
        if(self.selectedGroup){
            self.selectedGroup['content'] = ScribeUI.editorManager.get('groups').CMEditor.getValue();
        }

        self.selectedGroup = self.getGroupByName(this.value);

        if(self.selectedGroup){
            ScribeUI.editorManager.get('groups').CMEditor.setValue(self.selectedGroup.content);
        } else{
            ScribeUI.editorManager.get('groups').CMEditor.setValue("");
        }

        ScribeUI.editorManager.get('groups').CMEditor.clearHistory();

        ScribeUI.UI.resizeEditors();
        
        e.stopPropagation();
    });

    if(!silent || changeSelected){
        ScribeUI.UI.editor.groupSelect().trigger("change");
        if(self.selectedGroup){
            self.selectedGroup['content'] = ScribeUI.editorManager.get('groups').CMEditor.getValue();
        }    
    }
}

ScribeUI.Map.prototype.displayDescription = function(){
	var mapDescription = ScribeUI.UI.manager.mapDescription();
    mapDescription.empty();

    var image = $('<div>').attr('id', 'map-preview-img-large');
    if(this.thumbnail_url){
        image.addClass('thumbnail-preview').css('background-image', 'url("' + this.thumbnail_url + '")');
    } else{
        image.addClass('default-preview');
    }

    mapDescription.append(image);
    mapDescription.append("<p class=\"map-title\">" + this.name + "</p>");
    mapDescription.append("<p class=\"map-description\">" + this.description + "</p>");
    ScribeUI.UI.manager.mapActions().show();
};

ScribeUI.Map.prototype.updateComponents = function(){
    if(this.selectedGroup){
        this.selectedGroup['content'] = ScribeUI.editorManager.get('groups').CMEditor.getValue();    
    }
    this.map = ScribeUI.editorManager.get('map').CMEditor.getValue();
    this.scales = ScribeUI.editorManager.get('scales').CMEditor.getValue();
    this.variables = ScribeUI.editorManager.get('variables').CMEditor.getValue();
    this.symbols = ScribeUI.editorManager.get('symbols').CMEditor.getValue();
    this.fonts = ScribeUI.editorManager.get('fonts').CMEditor.getValue();
    this.projections = ScribeUI.editorManager.get('projections').CMEditor.getValue();
    this.readme = ScribeUI.editorManager.get('readme').CMEditor.getValue();     
}

ScribeUI.Map.prototype.save = function(){
    var self = this;
    this.updateComponents();

    var data = JSON.stringify({
        map: this.map,
        scales: this.scales,
        variables: this.variables,
        symbols: this.symbols,
        fonts: this.fonts,
        projections: this.projections,
        readme: this.readme,
        groups: this.groups
    })

    $.ajax({
        url: $API + '/maps/save/' + this.id,
        type: "POST",
        data: data,
        contentType:"application/json; charset=utf-8",
        dataType:"json",
        success: function(response) {
            if(response.status == 1){
                ScribeUI.UI.logs.notification().hide();

                if(!self.WMSLayer){
                    self.open();
                } else{
					//This is needed in case the user changed the map's name
					self.WMSLayer.mergeNewParams({layers: self.findTopLayerName()});
                    self.WMSLayer.redraw(true);
                }
                
                self.saved = true;  
            } else{
                if(!ScribeUI.UI.logs.logs().is(':visible')){
                    ScribeUI.UI.logs.notification().show('pulsate', 1000);
                }    
            }

            ScribeUI.UI.editor.mapfilePre().text(response.mapfile);
            ScribeUI.UI.logs.pre().text(response.logs);
        }
    })
}

ScribeUI.Map.prototype.display = function(){
    var scales = [];

    if(this.OLUnits == "meters" || this.OLUnits == null){     
        for(i in this.OLScales){
            scales[i] = Math.ceil(parseInt(this.OLScales[i])/10) * 10;
        }
    } else if(this.OLUnits == "dd"){
        for(i in this.OLScales){
            scales[i] = this.OLScales[i];
        }
    }

    if(this.OLExtent && this.OLProjection){
        var extent = this.OLExtent.split(" ");    
        var projection = new OpenLayers.Projection(this.OLProjection);

        var mapOptions = {
            allOverlays: true,
            projection: projection,
            maxExtent: extent,
            scales:  scales,
            units: projection.getUnits()
        };

        var OLMap = new OpenLayers.Map('map', mapOptions);
        //Openlayers control to display the current zoom level
        var currentZoomControl = new OpenLayers.Control();
        OpenLayers.Util.extend(currentZoomControl, {
            draw: function(){
                OpenLayers.Control.prototype.draw.apply(this, arguments);
                    if (!this.element) {
                        this.element = document.createElement('div');
                        this.div.setAttribute('class', 'olControlNoSelect');
                        this.div.setAttribute('class', 'olCurrentZoomLevelControl');
                        this.div.appendChild(this.element);
                    }
                    this.map.events.register('zoomend', this, this.updateZoomLevel);
                    this.updateZoomLevel();
                    return this.div;
             },
            updateZoomLevel: function(){
                var zoomlevel = this.map.getZoom();
                zoomlevel++;
                this.element.innerHTML = 'Zoom level : ' + zoomlevel;
            }

        });
        OLMap.addControls([new OpenLayers.Control.Scale(), new OpenLayers.Control.MousePosition(), currentZoomControl]);
		
        var WMSLayer = new OpenLayers.Layer.WMS(
            this.name,
            this.url,
            {
                layers: this.findTopLayerName(),
                format: "image/png"
            }, {
                singleTile: true,
                projection: projection//, 
				//resolutions: [156543.03390625, 78271.516953125, 39135.7584765625, 19567.87923828125, 9783.939619140625, 4891.9698095703125, 2445.9849047851562, 1222.9924523925781, 611.4962261962891, 305.74811309814453, 152.87405654907226, 76.43702827453613, 38.218514137268066, 19.109257068634033, 9.554628534317017, 4.777314267158508]
            }
        );

        OLMap.addLayers([WMSLayer]);

        OpenLayers.ProxyHost = "/cgi-bin/proxy.cgi?url=";
        var getFeatureInfo = new OpenLayers.Control.WMSGetFeatureInfo({
            url: this.url, 
            queryVisible: true,
            infoFormat: 'text/plain',
            vendorParams: {
                'FEATURE_COUNT': 100
            },
            eventListeners: {
                getfeatureinfo: function(event) {
                    if(event.text != ""){
                        getFeatureInfoDialog.find('pre').html(event.text);
                        getFeatureInfoDialog.dialog('open');
                    }
                }
            }
        });
        OLMap.addControl(getFeatureInfo);
        getFeatureInfo.activate();

        OLMap.zoomToExtent(extent);
        
        this.OLMap = OLMap;
        this.WMSLayer = WMSLayer;
		$.each(ScribeUI.plugins, function(index, plugin){
			if(plugin.onMapOpened){
				plugin.onMapOpened();
			}
		});

    }
}

ScribeUI.Map.prototype.close = function(){
	$.each(ScribeUI.plugins, function(index, plugin){
		if(plugin.onMapClosed){
			plugin.onMapClosed();
		}
	});

    if(this.OLMap){
        this.OLMap.destroy();
    }

    this.closeDataBrowser();
    this.clearGroups();

    this.clearComponents();
    this.clearPois();
    this.workspace.openedMap = null;
    this.previousGroup = null;
}

//Find the map's name in the mapeditor
ScribeUI.Map.prototype.findTopLayerName = function(){
	var layername = "MS"; //Mapserver's default
	var lineHandle = ScribeUI.editorManager.get('map').searchLine("NAME");

	if(lineHandle){
		var line = lineHandle.text.trim();

		strings = ["NAME:", "NAME :","NAME"];
		for(i in strings){
			if(line.indexOf(strings[i])>=0){
                //Removing the NAME
				layername = line.substr(strings[i].length, line.length).trim();

				var hadQuotes = 
				if(layername.indexOf("'") >= 0 || layername.indexOf('"') >= 0)
					hadQuotes = true;
				//Removing extra quotes
				layername = layername.replace(/^"*'*/, "")
				layername = layername.replace(/"*'*$/, "")

				//Scribe numbers all NAMEs, including the map name.
				if(this.type == "Scribe" && hadQuotes) // ...except the ones that are not in quotes.
					layername+="1";
				break;
			}
		}
	}
	return layername;
}
ScribeUI.Map.prototype.clearGroups = function(){
    ScribeUI.UI.editor.groupSelect().empty();
    ScribeUI.UI.editor.groupSelect().unbind('change');
}

ScribeUI.Map.prototype.clearComponents = function(){
    ScribeUI.UI.editor.groupSelect().empty();
    ScribeUI.UI.editor.groupSelect().trigger('chosen:updated');

    $.each(ScribeUI.editorManager.editors, function(key, editor){
        editor.CMEditor.setValue('');
    });

    ScribeUI.UI.editor.toolbar().find('button').button('disable');
    ScribeUI.UI.poi.actions().find('button').button('disable');
};

ScribeUI.Map.prototype.displayGroupsList = function(){
    var self = this;
    ScribeUI.UI.editor.groupsList().find('li').remove();

    $.each(this.groups, function(index, group){
        var li = $('<li>')
            .addClass('ui-state-default')
            .text(group.name)
            .appendTo(ScribeUI.UI.editor.groupsList());
    });

    ScribeUI.UI.editor.groupsList().selectable();

    ScribeUI.UI.editor.groupsList().find('li').click(function(e){
        ScribeUI.UI.editor.groupsList().find('li').removeClass("map-selected");
        $(this).addClass("map-selected");
        e.stopPropagation();
    });
}

ScribeUI.Map.prototype.raiseGroupIndex = function(name){
    var index = this.getGroupIndexByName(name);
    var group = this.getGroupByName(name);
    var bumpedGroup = this.groups[index - 1];

    if(index > 0){
        this.groups.splice(index - 1, 1, group);
        this.groups.splice(index, 1, bumpedGroup);
    }
}

ScribeUI.Map.prototype.lowerGroupIndex = function(name){
    var index = this.getGroupIndexByName(name);
    var group = this.getGroupByName(name);
    var bumpedGroup = this.groups[index + 1];

    if(index < this.groups.length){
        this.groups.splice(index + 1, 1, group);
        this.groups.splice(index, 1, bumpedGroup);
    }
}

ScribeUI.Map.prototype.setGroups = function(callback){
    var self = this;

    $.post($API + '/maps/' + this.id + '/groups/update', {
            removed_groups: this.removedGroups.join(),
            new_groups: this.newGroups.join(),
            groups: this.updatedGroups.join()
        }, 
        function(response) {
            if(response.status == 1){
                $.each(self.removedGroups, function(index, name){
                    self.removeGroup(name);
                });

                self.clearGroups();
                self.displayGroups(true);
                
                if(self.type == 'Standard'){
                    $.each(self.removedGroups, function(index, name){
                        removeIncludeFromMap(name + '.map', false);
                    });
                    $.each(self.groups, function(index, group){
                        removeIncludeFromMap(group.name + '.map', false);
                        addIncludeToMap(group.name + '.map', false);
                    });
                    self.save();
                }
            }
        }
    );
}

ScribeUI.Map.prototype.openDataBrowser = function(){
    var div = $('<div>').attr('id', "data-browser-child-" + this.name);
    ScribeUI.UI.dataBrowser().append(div);

    div.elfinder({
    url: '/cgi-bin/elfinder-python/connector-' + this.workspace.name + '-' + this.name + '.py',
        transport : new elFinderSupportVer1(),
        cssClass: 'file-manager',
        resizable: false,
        commands: [
        'open', 'reload', 'home', 'up', 'back', 'forward', 'getfile', 
        'rename', 'mkdir', 'mkfile', 'copy', 'paste', 'help', 'rm',
        'sort', 'tree', 'upload', 'extract', 'archive', 'view'
        ]
    }).elfinder('instance');

    ScribeUI.UI.dataBrowser().trigger("resize");
}

ScribeUI.Map.prototype.closeDataBrowser = function(){ 
    if(ScribeUI.UI.dataBrowser().children().length > 0){
        $("#data-browser-child-" + this.name).elfinder('destroy');
        $("#data-browser-child-" + this.name).remove();
    }
}

ScribeUI.Map.prototype.exportSelf = function(publicData, privateData, callback){
    $("#preparingExport").css("visibility","visible");

    var self = this;
    publicData = publicData == true ? 1 : 0;
    privateData = privateData == true ? 1 : 0;

    $.post($SCRIPT_ROOT + '/_export_map', {
        name: this.name,
        publicData: publicData,
        privateData: privateData
    }, function(url) {
        $("#preparingExport").css("visibility","hidden");
        if(callback != null){
            callback.call();    
        }

        var link = $("<a/>", {
            "id": "export-link",
            "href": url
        }).appendTo("body")
                           
        link.click(function(e) {
            e.preventDefault();  //stop the browser from following
            window.location.href = url;
        }).click();
    }); 
}

ScribeUI.Map.prototype.configure = function(config){
    var self = this;

    $.post($API + '/maps/configure/' + this.id, config, function(response) {
        if(response.status == 1){
            self.description = config.description;
            self.git_url = config.git_url;
            self.displayDescription();
            ScribeUI.UI.manager.git.configureLogs().val(response.logs);    
        }
    });
}

ScribeUI.Map.prototype.gitCommit = function(data){
    var self = this;

    $.post($API + '/maps/commit/' + this.id, data, function(response) {
        if(response.status == 1){
            self.open(); 
        }
        ScribeUI.UI.manager.git.commitLogs().val(response.logs);
    });
}

ScribeUI.Map.prototype.gitPull = function(data){
    var self = this;

    $.post($API + '/maps/pull/' + this.id, data, function(response) {
        if(response.status == 1){
            self.open(); 
        }
        ScribeUI.UI.manager.git.pullLogs().val(response.logs);
    });
}

ScribeUI.Map.prototype.getDebug = function(){
    var self = this;
    $.getJSON($API + '/maps/' + self.id + '/debug/get' , {}, function(response) {
        if(response.status == 1){
            ScribeUI.UI.logs.debugPre().text(response.debug);
        } else{
            var debug = '';
            $.each(response.errors, function(index, error){
                debug += error + '\n'
            });
            ScribeUI.UI.logs.debugPre().text(debug); 
        }
    });    
}

ScribeUI.Map.prototype.clearDebug = function(){
    ScribeUI.UI.logs.debugPre().text('');
    $.getJSON($API + '/maps/' + this.id + '/debug/reset' , {}, function(response) {}); 
}

ScribeUI.Map.prototype.clearPois = function(){
    ScribeUI.UI.poi.select().empty().trigger('chosen:updated');
}

ScribeUI.Map.prototype.getPOIByName = function(name){
    for(var i = 0; i < this.pois.length; i++){
        if(this.pois[i].name == name){
            return this.pois[i];
            break;
        }
    }
    return null;
};

ScribeUI.Map.prototype.zoomToPOI = function(name){
    var poi = this.getPOIByName(name);
    if(poi){
        var projection = this.OLMap.getProjection();
        var lonLat = new OpenLayers.LonLat(poi.lon, poi.lat);

        if(poi.projection){
            var poiProjection = poi.projection.replace('\n', '').toUpperCase();
            lonLat = lonLat.transform(new OpenLayers.Projection(poiProjection), new OpenLayers.Projection(projection.toUpperCase()));
        }

        var level = poi.scale == null ? 10 : poi.findScaleLevel(poi.scale);
        this.OLMap.setCenter(lonLat, level);
    }
}

ScribeUI.Map.prototype.addPOI = function(name){
    var self = this;

    var center = this.OLMap.getCenter();
    var projection = this.OLMap.getProjection();
    var lonLat = center.transform(new OpenLayers.Projection(projection.toUpperCase()), new OpenLayers.Projection('EPSG:4326'));
    var scale = this.OLMap.getScale();

    $.post($API + '/maps/' + this.id + '/pois/new', {
        name: name,
        lon: lonLat.lon, 
        lat: lonLat.lat, 
        scale: scale,
        projection: 'EPSG:4326'
    }, function(response) {
        if(response.status == 1){
            var poi = new ScribeUI.POI(name, lonLat.lon, lonLat.lat, scale, 'EPSG:4326');
            poi.map = self;
            self.pois.push(poi);

            var option = $('<option>').val(name).text(name);
            ScribeUI.UI.poi.select().append(option); 
            ScribeUI.UI.poi.select().trigger('chosen:updated');
        }

    });
}


//Static functions:
ScribeUI.Map.openMap = function(){
    var map = ScribeUI.workspace.selectedMap;
    if(map){
        map.open();
    }
}

ScribeUI.Map.deleteMap = function(){
    var msg = 'Are you sure you want to delete this map?';
    var div = $("<div class=\"scribe-dialog\">" + msg + "</div>");
    
    var name = ScribeUI.workspace.selectedMap.name;

    if(name != null){
        div.dialog({
            title: "Confirm",
            resizable: false,
            buttons: [{
                 text: "Yes",
                 click: function () {
                    ScribeUI.workspace.deleteMap(ScribeUI.workspace.selectedMap);
                    div.dialog("close");
                }
            },
            {
                text: "No",
                click: function () {
                    div.dialog("close");
                }
            }]
        });
    }
}

ScribeUI.Map.exportMap = function(){
     var name = $("#map-list .ui-selected").text();
     if (name){
         $("#preparingExport").css("visibility","hidden");
         $("#exportmap-form").dialog({
            autoOpen: false,
            resizable: false,
            width: 300,
            height: 200,
            modal: true,
            buttons: {
                Export: function() {
                    var checkBoxes = $("input[name='exportComponents']");
                    var components = {};

                    $.each(checkBoxes, function() {
                        if ($(this).attr('checked')){
                            components[this.value] = 1;    
                        } else {
                            components[this.value] = 0;
                        }
                    });
            
                    var mapToExport = new ScribeUI.Map(name);

                    var self = this;
                    mapToExport.exportSelf(components["publicData"], components["privateData"], function(){$(self).dialog("close");})
                    
                },
                Cancel: function() {
                    $(this).dialog("close");
                }
            },
            close: function() {}
        }).dialog("open");
    }        
}

ScribeUI.Map.onMapMoveEnd = function(){
    setTimeout(function(){ScribeUI.UI.displayDebug()},500);
}

ScribeUI.Map.onMapOpened = function(){
    for(i in ScribeUI.plugins){
        if(plugins[i].onMapOpened)
            plugins[i].onMapOpened();
    }
}
ScribeUI.Map.removeIncludeFromMap = function(filename, commit){
    var mapCMEditor = ScribeUI.editorManager.get('map').CMEditor;
    for(var i=0; i < mapCMEditor.lineCount(); i++){
        if( mapCMEditor.getLine(i).indexOf("layers/" + filename) !== -1){
            var line =  mapCMEditor.getLine(i);
			mapCMEditor.removeLine(i);
            break;
        }
    }
}
ScribeUI.Map.addIncludeToMap = function(filename, commit){
    //Find the includes in the mapeditor
    lastinc = -1;
    //BUG: WE SHOULD SET THE EDITOR SELECT TO THE MAP OPTION
    //ALSO, THIS FUNCTION IS CALLED FOR EVERY GROUP EVEN IF IT HAS ALREADY BEEN ADDED TO THE MAPFILE
    var mapCMEditor = ScribeUI.editorManager.get('map').CMEditor;
    ScribeUI.UI.openSecondaryPanel(ScribeUI.editorManager.get("map"));
    for(var i=0; i <  mapCMEditor.lineCount(); i++){
        if( mapCMEditor.getLine(i).indexOf("INCLUDE") !== -1){
            lastinc = i;
        }else if(lastinc > -1){
            //We add the new file at the end of the include list
            var line =  mapCMEditor.getLine((i-1));
            //TODO detect indentation 
            mapCMEditor.setLine((i-1), line+"\n    INCLUDE 'layers/"+filename+"'");
            //Highlight for a short time:
            //mapEditor.setLineClass(i, 'background', 'setextent-highlighted-line');
            //setTimeout(function(){
            //    mapEditor.setLineClass(i, 'background', '');
            //}, 3000);
            break;
        }
    }
}
