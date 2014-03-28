 function Map(options){
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

Map.prototype.open = function(callback){
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
                    oPoi = new POI(
                        poi.name, 
                        poi.lon, 
                        poi.lat, 
                        poi.scale, 
                        poi.projection
                    );
                    oPoi.map = self;
                    pois.push(oPoi);

                    var option = $('<option>').val(poi.name).text(poi.name);
                    selectors.poiSelect().append(option); 
                });
                self.pois = pois;
                selectors.poiSelect().trigger('chosen:updated');

                self.previousGroup = null;

                self.displayComponents();

                self.display();

                self.saved = true;

                $("#map-name").text(self.name);
            }
        }
    );
};

Map.prototype.getGroupByName = function(name){
    for(var i = 0; i < this.groups.length; i++){
        if(this.groups[i].name == name){
            return this.groups[i];
        }
    }
    return null;
};

Map.prototype.getGroupIndexByName = function(name){
    for(var i = 0; i < this.groups.length; i++){
        if(this.groups[i].name == name){
            return i;
            break;
        }
    }
    return null;
};

Map.prototype.removeGroup = function(name){
    var index = this.getGroupIndexByName(name);
    this.groups.splice(index, 1);
};

Map.prototype.displayComponents = function(){
    editors['maps'].setValue(this.map == null ? '' : this.map);
    editors['scales'].setValue(this.scales == null ? '' : this.scales);
    editors['variables'].setValue(this.variables == null ? '' : this.variables);
    editors['symbols'].setValue(this.symbols == null ? '' : this.symbols);
    editors['fonts'].setValue(this.fonts == null ? '' : this.fonts);
    editors['projections'].setValue(this.projections == null ? '' : this.projections);
    editors['readmes'].setValue(this.readme == null ? '' : this.readme);

    selectors.editorSelect().change(function(e){
        openSecondaryPanel($(this).val());
    });

    selectors.logs().find('textarea').val('');

    $.each(editors, function(key, editor){
        editor.clearHistory();
    });

    
    selectors.editorToolbar().find('button').button('enable');
    selectors.poiActions().find('button').button('enable');

    this.displayGroups();
};

Map.prototype.displayGroups = function(silent){
    var self = this;
    var changeSelected = true;

    $.each(this.groups, function(index, group){
        var option = $('<option>').val(group.name).text(group.name);
        if(self.selectedGroup && group.name == self.selectedGroup.name){
            option.attr('selected', 'selected');
            changeSelected = false; 
        }
        selectors.groupSelect().append(option);    
    });
    selectors.groupSelect().trigger("chosen:updated");

    selectors.groupSelect().change(function(e){
        if(self.selectedGroup){
            self.selectedGroup['content'] = editors['groups'].getValue();
        }

        self.selectedGroup = self.getGroupByName(this.value);

        //resizeEditors();

        if(self.selectedGroup){
            editors['groups'].setValue(self.selectedGroup.content);
        } else{
            editors['groups'].setValue("");
        }

        editors['groups'].clearHistory();

        resizeEditors();
        
        e.stopPropagation();
    });

    if(!silent || changeSelected){
        selectors.groupSelect().trigger("change");
        if(self.selectedGroup){
            self.selectedGroup['content'] = editors['groups'].getValue();
        }    
    }
}

Map.prototype.displayDescription = function(){
    selectors.mapDescription().empty();

    var image = $('<div>').attr('id', 'map-preview-img-large');
    if(this.thumbnail_url){
        image.addClass('thumbnail-preview').css('background-image', 'url("' + this.thumbnail_url + '")');
    } else{
        image.addClass('default-preview');
    }

    selectors.mapDescription().append(image);
    selectors.mapDescription().append("<p class=\"map-title\">" + this.name + "</p>");
    selectors.mapDescription().append("<p class=\"map-description\">" + this.description + "</p>");
    selectors.mapActions().show();
};

Map.prototype.updateComponents = function(){
    if(this.selectedGroup){
        this.selectedGroup['content'] = editors['groups'].getValue();    
    }
    this.map = editors['maps'].getValue();
    this.scales = editors['scales'].getValue();
    this.variables = editors['variables'].getValue();
    this.symbols = editors['symbols'].getValue();
    this.fonts = editors['fonts'].getValue();
    this.projections = editors['projections'].getValue();
    this.readme = editors['readmes'].getValue();     
}

Map.prototype.save = function(){
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
                selectors.logsNotification().hide();

                if(!self.WMSLayer){
                    self.open();
                } else{
                    self.WMSLayer.redraw(true);
                }
                
                self.saved = true;  
            } else{
                if(!selectors.logs().is(':visible')){
                    selectors.logsNotification().show('pulsate', 1000);
                }    
            }

            selectors.mapfilePre().text(response.mapfile);
            selectors.logsPre().text(response.logs);
        }
    })
}

Map.prototype.display = function(){
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
                layers: "default",
                format: "image/png"
            }, {
                singleTile: true,
                projection: projection, 
				resolutions: [156543.03390625, 78271.516953125, 39135.7584765625, 19567.87923828125, 9783.939619140625, 4891.9698095703125, 2445.9849047851562, 1222.9924523925781, 611.4962261962891, 305.74811309814453, 152.87405654907226, 76.43702827453613, 38.218514137268066, 19.109257068634033, 9.554628534317017, 4.777314267158508]
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
		$.each(plugins, function(index, plugin){
			if(plugin.onMapOpened){
				plugin.onMapOpened();
			}
		});

    }
}

Map.prototype.close = function(){
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

Map.prototype.clearGroups = function(){
    selectors.groupSelect().empty();
    selectors.groupSelect().unbind('change');
}

Map.prototype.clearComponents = function(){
    selectors.groupSelect().empty();
    selectors.groupSelect().trigger('chosen:updated');

    $.each(editors, function(key, editor){
        editor.setValue('');
    });

    selectors.editorToolbar().find('button').button('disable');
    selectors.poiActions().find('button').button('disable');
};

Map.prototype.displayGroupsList = function(){
    var self = this;
    selectors.groupsList().find('li').remove();

    $.each(this.groups, function(index, group){
        var li = $('<li>')
            .addClass('ui-state-default')
            .text(group.name)
            .appendTo(selectors.groupsList());
    });

    selectors.groupsList().selectable();

    selectors.groupsList().find('li').click(function(e){
        selectors.groupsList().find('li').removeClass("map-selected");
        $(this).addClass("map-selected");
        e.stopPropagation();
    });
}

Map.prototype.raiseGroupIndex = function(name){
    var index = this.getGroupIndexByName(name);
    var group = this.getGroupByName(name);
    var bumpedGroup = this.groups[index - 1];

    if(index > 0){
        this.groups.splice(index - 1, 1, group);
        this.groups.splice(index, 1, bumpedGroup);
    }
}

Map.prototype.lowerGroupIndex = function(name){
    var index = this.getGroupIndexByName(name);
    var group = this.getGroupByName(name);
    var bumpedGroup = this.groups[index + 1];

    if(index < this.groups.length){
        this.groups.splice(index + 1, 1, group);
        this.groups.splice(index, 1, bumpedGroup);
    }
}

Map.prototype.setGroups = function(callback){
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

Map.prototype.openDataBrowser = function(){
    var div = $('<div>').attr('id', "data-browser-child-" + this.name);
    selectors.dataBrowser().append(div);

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

    selectors.dataBrowser().trigger("resize");
}

Map.prototype.closeDataBrowser = function(){ 
    if(selectors.dataBrowser().children().length > 0){
        $("#data-browser-child-" + this.name).elfinder('destroy');
        $("#data-browser-child-" + this.name).remove();
    }
}

Map.prototype.exportSelf = function(publicData, privateData, callback){
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

Map.prototype.configure = function(config){
    var self = this;

    $.post($API + '/maps/configure/' + this.id, config, function(response) {
        if(response.status == 1){
            self.description = config.description;
            self.git_url = config.git_url;
            self.displayDescription();
            selectors.configureLogs().val(response.logs);    
        }
    });
}

Map.prototype.gitCommit = function(data){
    var self = this;

    $.post($API + '/maps/commit/' + this.id, data, function(response) {
        if(response.status == 1){
            self.open(); 
        }
        selectors.gitCommitLogs().val(response.logs);
    });
}

Map.prototype.gitPull = function(data){
    var self = this;

    $.post($API + '/maps/pull/' + this.id, data, function(response) {
        if(response.status == 1){
            self.open(); 
        }
        selectors.gitPullLogs().val(response.logs);
    });
}

Map.prototype.getDebug = function(){
    var self = this;
    $.getJSON($API + '/maps/' + self.id + '/debug/get' , {}, function(response) {
        if(response.status == 1){
            selectors.debugPre().text(response.debug);
        } else{
            var debug = '';
            $.each(response.errors, function(index, error){
                debug += error + '\n'
            });
            selectors.debugPre().text(debug); 
        }
    });    
}

Map.prototype.clearDebug = function(){
    selectors.debugPre().text('');
    $.getJSON($API + '/maps/' + this.id + '/debug/reset' , {}, function(response) {}); 
}

Map.prototype.clearPois = function(){
    selectors.poiSelect().empty().trigger('chosen:updated');
}

Map.prototype.getPOIByName = function(name){
    for(var i = 0; i < this.pois.length; i++){
        if(this.pois[i].name == name){
            return this.pois[i];
            break;
        }
    }
    return null;
};

Map.prototype.zoomToPOI = function(name){
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

Map.prototype.addPOI = function(name){
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
            var poi = new POI(name, lonLat.lon, lonLat.lat, scale, 'EPSG:4326');
            poi.map = self;
            self.pois.push(poi);

            var option = $('<option>').val(name).text(name);
            selectors.poiSelect().append(option); 
            selectors.poiSelect().trigger('chosen:updated');
        }

    });
}



