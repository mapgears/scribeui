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
    this.errorWidgets = [];
    this.OLScales = [];

    if(options){
        this.OLScales = options.OLScales ? options.OLScales : this.OLScales; 
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

                self.save(); //This is to get and display errors when loading a map

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
    $('.wms-url-container').show();
    $('#wms-url').val(this.url);
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
    ScribeUI.UI.logs.pre().text('');

    //Create the debugging query to be run with mapserv
    //Capture everything before map= and remove it.
    var regexExp = /(.*\?)map=/
    var match = regexExp.exec(self.WMSLayer.getFullRequestString())

    queryString = self.WMSLayer.getFullRequestString().replace(match[1], '')
    //Then add some debugging parameters
        + "&BBOX=" + self.WMSLayer.getTilesBounds().toBBOX()
        + '&WIDTH=' + self.WMSLayer.getImageSize().w
        + '&HEIGHT=' + self.WMSLayer.getImageSize().h;

    var data = JSON.stringify({
        map: this.map,
        scales: this.scales,
        variables: this.variables,
        symbols: this.symbols,
        fonts: this.fonts,
        projections: this.projections,
        readme: this.readme,
        groups: this.groups,
        query: queryString
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
                ScribeUI.UI.logs.notification().show('pulsate', 1000);
            }

            ScribeUI.UI.editor.mapfilePre().setValue(response.mapfile);
            ScribeUI.UI.logs.pre().append(response.logs + "\n\n");

            for (var i = 0; i < self.errorWidgets.length; ++i)
            {
                self.errorWidgets[i].editor.removeLineWidget(self.errorWidgets[i].widget);
            }

            self.handleDebug(response.logs, response.mapfile);
        }
    })
}

/*
debugText: string, content of the debug tab
mapfile: string, mapfile version of the map

This function takes the map's debug output, displays the errors and places
markers in the result tab if possible.
*/
ScribeUI.Map.prototype.handleDebug = function(debugText, mapfile){
    regexError = /(.*\b(error)\b.*)/gi;
    regexSyntaxError = /\((.[^\(\)]*)\):\(line ([0-9]*)\)/g;
    var errorArray = [];
    error = regexError.exec(debugText);

    //Build a list of strings containing 'error', excepted the projection one
    while(error != null){
        if(error[0].indexOf('tolerance condition error') == -1){ //Ignore this error
            errorArray.push(error[0]);
        }
        //Check for the next one
        error = regexError.exec(debugText);
    }

    //Handle the errors if there are any
    if(errorArray.length > 0){

        //Error notification
        ScribeUI.UI.logs.pre().append('Errors: \n');
        ScribeUI.UI.logs.notification().show('pulsate', 1000);

        for(i = 0; i < errorArray.length; i++){
            //Find line numbers (syntax errors)
            syntaxError = regexSyntaxError.exec(errorArray[i]);
            if(syntaxError != null){
                var line = parseInt(syntaxError[2]);

                //Place an error widget in the result area
                var div = document.createElement("div");
                div.innerHTML = errorArray[i];
                div.setAttribute('class', 'outputError');
                ScribeUI.UI.editor.mapfilePre().addLineWidget(line-1, div);

                //Log the error with a link
                var link = $('<a href="javascript:void(0);">' + errorArray[i] + '</a>').click(function(){
                    ScribeUI.UI.displayResultLine(line);
                });
                ScribeUI.UI.logs.pre().append(link);
                ScribeUI.UI.logs.pre().append("\n");

                //Find and place a marker in the scribe mapeditor area
                this.markError(syntaxError[1], syntaxError[2], errorArray[i]);
            }
            else{ //Log the error without a link
                ScribeUI.UI.logs.pre().append(errorArray[i] + '\n');
            }
        }
    }
}

/*
mapfile: string, mapfile version of the map
error: string, the unknown identifier in the error
lineNumber: int, the line where the error is located
errorMessage: string, the error message

This function places markers in the scribe version of the map
for any errors marked in the result tab
*/
ScribeUI.Map.prototype.markError = function(error, lineNumber, errorMessage){
    loc = ScribeUI.workspace.openedMap.findLine(error, lineNumber);
    /*loc contains the line number where the error is located in Scribe,
    the editor in which it's located and the group if there's one */

    if(loc == null){
        ScribeUI.UI.logs.pre().append("This error couldn't be located in the editor. Use the result tab instead.\n");
    }
    else {
        //Log it
        ScribeUI.UI.logs.pre().append("Error located at ")
        linkString = 'line '+ (parseInt(loc.lineNumber)+1) +' in editor "' + loc.editor.name + '"';
        if(loc.group != undefined)
        {
            linkString += ' in group "' + loc.group + '"';
        }

        //The error widget div
        var div = document.createElement("div");
        div.innerHTML = errorMessage;
        div.setAttribute('class', 'outputError');

        //Add it to the opened group if it's the right one or to the editor if it's not a group
        if(loc.group != undefined && ScribeUI.workspace.openedMap.selectedGroup.name == loc.group || loc.group == undefined)
        {
            widget = loc.editor.CMEditor.addLineWidget(loc.lineNumber, div);

            //Push it so it can be removed later
            this.errorWidgets.push({editor: loc.editor.CMEditor, widget: widget});
        }

        //Add the link to go to the correct location and add the widget
        var self = this;
        var link = $('<a href="javascript:void(0);">' + linkString + '</a>').click(function(){
            ScribeUI.UI.switchToLayer(loc);
            widget = loc.editor.CMEditor.addLineWidget(loc.lineNumber, div);

            //Push it so it can be removed later
            self.errorWidgets.push({editor: loc.editor.CMEditor, widget: widget});
        });
        ScribeUI.UI.logs.pre().append(link);
        ScribeUI.UI.logs.pre().append('\n');
    }

}

ScribeUI.Map.prototype.findLine = function(line, lineNumber){
    var result = null;
    var nbMatches = 0; //If more than one match, use another way
    var initialLineNumber = lineNumber;
    for(var key in ScribeUI.editorManager.editors){
        if(key == "groups") { //For groups, check every group
            nbOptions = ScribeUI.workspace.openedMap.groups.length;
            for(i = 0; i < nbOptions; i++)
            {
                groupName = ScribeUI.workspace.openedMap.groups[i].name;
                content = ScribeUI.workspace.openedMap.groups[i].content;

                lineNumber = this.searchLine(line, content);
                if(lineNumber != null){
                    nbMatches++;
                    result = {editor: ScribeUI.editorManager.get(key),
                            lineNumber: lineNumber,
                            group: groupName};
                }
            }
        }
        else {
            content = ScribeUI.workspace.openedMap[key];
            lineNumber = this.searchLine(line, content);
            if(lineNumber != null){
                nbMatches++;
                result = {editor: ScribeUI.editorManager.get(key),
                        lineNumber: lineNumber};
            }
        }
    }
    if(nbMatches != 1) {
        result = this.findLineFromMSLine(line, initialLineNumber);
    }
    return result;
}

//This function finds the line using a different method if the previous one has returned more than one result
ScribeUI.Map.prototype.findLineFromMSLine = function(line, msLineNumber){
    msLine = ScribeUI.UI.editor.mapfilePre().getLineHandle(msLineNumber-1).text.trim();
    msLineArray = msLine.split(' ');
    var regString = '';
    var result;
    while(msLineArray.length > 0)
    {
        regString += '(' + msLineArray[0] + ')';
        msLineArray.shift();
        if(msLineArray.length > 0)
        {
            regString += '.*'
        }
    }
    var regex = new RegExp(regString, 'g');
    var nbMatches = 0;

    for(var key in ScribeUI.editorManager.editors){
        if(key == "groups") { //For groups, check every group
            nbOptions = ScribeUI.workspace.openedMap.groups.length;
            for(i = 0; i < nbOptions; i++)
            {
                groupName = ScribeUI.workspace.openedMap.groups[i].name;
                content = ScribeUI.workspace.openedMap.groups[i].content;
                contentArray = content.split('\n');
                for(j = 0; j < contentArray.length; j++)
                {
                    var match = contentArray[j].match(regex);
                    if(match != null)
                    {
                        result = {editor: ScribeUI.editorManager.get(key),
                                  lineNumber: j,
                                  group: groupName};
                        nbMatches++;
                    }
                }
            }
        }
        else {
            content = ScribeUI.workspace.openedMap[key];
            contentArray = content.split('\n');
            for(j = 0; j < contentArray.length; j++)
            {
                var match = contentArray[j].match(regex);
                if(match != null)
                {
                    result = {editor: ScribeUI.editorManager.get(key),
                              lineNumber: j};
                    nbMatches++;
                }
            }
        }
    }
    if(nbMatches == 1){
        return result;
    }
    else return null;
}

ScribeUI.Map.prototype.searchLine = function(needle, haystack){
    haystackArray = haystack.split('\n');
	for(var i=0; i < haystackArray.length; i++){
		var line = haystackArray[i];
		if(line.indexOf(needle) !== -1){
			return i;
		}
	}
    return null;
}

ScribeUI.Map.prototype.display = function(){
    var scales = [];
    var self = this;

    if(this.OLUnits == "meters" || this.OLUnits == null){
        for(i in this.OLScales){
            scales.push(parseInt(this.OLScales[i]));
        }
    } else if(this.OLUnits == "dd"){
        for(i in this.OLScales){
            scales.push(this.OLScales[i]);
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

        WMSLayer.events.register("loadend", WMSLayer, function(){
            if($(".olImageLoadError").length > 0) {
                //Add error message over map
                $('.map-render-error').show();
            }
            else {
                $('.map-render-error').hide();
            }
            self.getDebug();
        });

        OLMap.addLayers([WMSLayer]);

        OpenLayers.ProxyHost = $SETTINGS.cgibin_url + "/mapserv?url=";
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

    //Remove leftover text
    $("#map-name").text('');
    ScribeUI.UI.editor.mapfilePre().setValue('');
    ScribeUI.UI.logs.pre().text('');
    ScribeUI.UI.logs.debugPre().text('');

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

				var hadQuotes = false;
				if(layername.indexOf("'") >= 0 || layername.indexOf('"') >= 0)
					hadQuotes = true;
				//Removing extra quotes
				layername = layername.replace(/^"*'*/, "")
				layername = layername.replace(/"*'*$/, "")

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
                    self.updateGroups();
                    self.save();
                }
            }
            else{
                alert(response.errors);
                $.each(response.groups, function(index, name){
                    self.removeGroup(name);
                })
                self.updateGroups();
            }
        }
    );
}

/* This function replaces removeIncludeFromMap and addIncludeToMap.
   It is called when a standard map's groups are changed.
   Its objective is to update and replace the "include" strings in the mapfile,
   in the correct order. */
ScribeUI.Map.prototype.updateGroups = function(){
    //First, remove all groups from the mapfile
    var mapCMEditor = ScribeUI.editorManager.get('map').CMEditor;

    for(var i=0; i < mapCMEditor.lineCount(); i++){
        var line = mapCMEditor.getLine(i);
        //Rewrite the map file, skipping include lines
        if (line.search(/layers\/.*\.map/) !== -1){
            mapCMEditor.replaceRange("", CodeMirror.Pos(i-1), CodeMirror.Pos(i));
            i--;
        }
    }

    //Find the last "END" value
    var lastEnd = 0;
    for(var i = mapCMEditor.lineCount() - 1; i >= 0 && lastEnd == 0; i--){
        if(mapCMEditor.getLine(i).indexOf("END") !== -1){
            lastEnd = i;
        }
    }

    //After that, put the groups back in, in the correct order
    for(var i=0; i < this.groups.length; i++) {
        mapCMEditor.replaceRange("\n    "
            + "INCLUDE 'layers/"+this.groups[i].name + '.map'+"'",
            CodeMirror.Pos(lastEnd - 1 + i))
    }

}

ScribeUI.Map.prototype.openDataBrowser = function(){
    var div = $('<div>').attr('id', "data-browser-child-" + this.name);
    ScribeUI.UI.dataBrowser().append(div);

    div.elfinder({
    url: $SETTINGS.cgibin_url + '/elfinder-python/connector-' + this.workspace.name + '-' + this.name + '.py',
        transport : new elFinderSupportVer1(),
        cssClass: 'file-manager',
        resizable: false,
        height:ScribeUI.UI.dataBrowser().height()-2,
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
    //Clear logs
    ScribeUI.UI.manager.exportMap.logs().text('');

    //Set in progress
    $("#export-status").removeClass("export-complete");
    $("#export-status").text("In progress");
    $("#export-load-spinner").show();

    //Export map
    var form = $("#exportmap-form");
    form.attr("action", $API + '/maps/export/' + this.id);
    form.submit();

    /* This code checks the logs every second and stops once the logs say it's
       finished */
    ScribeUI.Map.checkLogs(ScribeUI.UI.manager.exportMap.logs(), 'export', this.id);
}

/* Function to check import or export logs on the server.
   Parameters:
       logElement: element for the log box
       operation: string, 'import' or 'export'
       mapID: Map ID
*/
ScribeUI.Map.checkLogs = function(logElement, operation, mapID) {
    $.ajax({
        type: "POST",
        url: $API + '/maps/'+mapID+'/logs/view',
        data: {
            'start': logElement.text().length,
            'operation': operation
        },
        success: function(response){
            //Check if we continue logging
            if(!response || response.length == 0){ //No logs yet
                ScribeUI.Map.logsTimer = setTimeout(function(){ScribeUI.Map.checkLogs(logElement, operation, mapID);}, 500)
            }
            else
            {
                //Display logs
                logElement.append(response);
                logElement.scrollTop(logElement[0].scrollHeight - logElement.height());

                //Check if the logs are finished
                var lines = response.split('\n');
                var lastLine = lines[lines.length - 2];
                if(lastLine.indexOf("END") == -1){
                    //Logs not finished
                    ScribeUI.Map.logsTimer = setTimeout(function(){ScribeUI.Map.checkLogs(logElement, operation, mapID);}, 1000);
                }
                else {
                    //Delete the logs
                    ScribeUI.Map.deleteLogs(operation, mapID);

                    //Show it's finished on response from export
                    if(operation == "export"){
                        $("#export-status").text("Complete")
                        $("#export-status").addClass("export-complete");
                        $("#export-load-spinner").hide();
                    }
                }
            }
        }
    });
}

ScribeUI.Map.deleteLogs = function(operation, mapID)
{
    $.ajax({
        type: "POST",
        url: $API + '/maps/'+mapID+'/logs/delete',
        data: {
            'operation': operation
        }
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
        this.OLMap.setCenter(lonLat, parseInt(level));
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

ScribeUI.Map.prototype.removePOI = function(name){
    var self = this;

    $.post($API + '/maps/' + this.id + '/pois/delete', {
        name: name
    }, function(response) {
        if(response.status == 1){
			ScribeUI.UI.poi.select().children("option[value='"+name+"']").remove();
            ScribeUI.UI.poi.select().trigger('chosen:updated');
            for(i in self.pois){
                if(self.pois[i].name == name)
                    self.pois.splice(i,  1);
            }
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
            width: "auto",
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

ScribeUI.Map.exportMap = function()
{
    //Clear logs
    ScribeUI.UI.manager.exportMap.logs().text('');
    var map = ScribeUI.workspace.selectedMap;
    ScribeUI.Map.deleteLogs("export", map.id);

    var name = ScribeUI.workspace.selectedMap.name;
    if (name){
        $("#export-status").text("Not started");
        $("#export-load-spinner").hide();
        $("#export-status").removeClass("export-complete");
        $("#exportmap-div").dialog({
            autoOpen: false,
            resizable: false,
            width: "auto",
            height: "auto",
            modal: true,
            buttons: {
                Export: function() {
                    var map = ScribeUI.workspace.selectedMap;
                    if(map){
                        map.exportSelf();
                    };
                },
                Close: function() {
                    $(this).dialog("close");
                }
            },
            close: function() {}
        }).dialog("open");
    }
}

ScribeUI.Map.onMapMoveEnd = function(){
    //setTimeout(function(){ScribeUI.UI.displayDebug()},500);
}

ScribeUI.Map.onMapOpened = function(){
    for(i in ScribeUI.plugins){
        if(plugins[i].onMapOpened)
            plugins[i].onMapOpened();
    }
}
