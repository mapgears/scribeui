 function Map(name, options){
    this.name = name;
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

    if(options){
        this.url = options.url ? options.url : this.url;
        this.thumbnail = options.thumbnail ? options.thumbnail : this.thumbnail;
        this.workspace = options.workspace ? options.workspace : null;
        this.type = options.type ? options.type : this.template;
        this.template = options.template ? options.template : this.template;
        this.templateLocation = options.templateLocation ? options.templateLocation : this.templateLocation;
        this.locationPassword = options.locationPassword ? options.locationPassword : this.locationPassword;
        this.description = options.description ? options.description : this.description;
        this.OLMap = options.OLMap ? options.OLMap : this.OLMap;
        this.WMSLayer = options.WMSLayer ? options.WMSLayer : this.WMSLayer;
    }
}

Map.prototype.create = function(clone, callback){
    var self = this;
    $.post($SCRIPT_ROOT + '/_create_map', {
        name: this.name,
        type: this.type,
        template: this.template,
        templatelocation: this.templateLocation,
        locationpassword: this.locationPassword,
        description: this.description
    }, function(status) {
        if(status == "1") {
            if(clone){
                self.gitClone(clone, callback);
            } else{
                self.workspace.maps.push(self);
                self.workspace.displayMaps();
                self.open();    
            }
        }else {
            alert(status);
        }
    });
}

Map.prototype.open = function(callback){
    var self = this;
    $.post($SCRIPT_ROOT + '/_open_map', {
        name: this.name
    }, function(data) {
        if(typeof(data) == "object") {
            $.each(data, function(key, element){
            self[key] = element;
        });

            if(self.workspace.openedMap){
                self.workspace.openedMap.close();
            }

            self.workspace.openedMap = self;
            self.displayComponents();
            self.display();
            self.getResultingMapfile();
            self.saved = true;
            $("#info").text(self.workspace.name + " / " + self.name);
            
            onMapOpened();

            if(callback){
                callback.call(self);
            }
        }else {
        alert(data);
    }
    });
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

Map.prototype.createGroup = function(name){
    var self = this;
    if(!this.getGroupByName(name)){
        $.post($SCRIPT_ROOT + '/_add_group', {
            name: name
        }, function(status) {
            if(status == 1){
                var group = {"name": name, "content": ""}
                if(self.type == "Standard")
                    if(group.name.indexOf(".map") == -1)
                        group.name = group.name+".map";
                
                self.groups.push(group);
                
                var groupSelect = $("#" + self.workspace.groupSelect);
                groupSelect.append($("<option></option>").attr("value", group.name).text(group.name));
                groupSelect.trigger('chosen:updated');

                self.displayGroupsIndex();
                
                //Include the new group in the map
                if(self.type == "Standard")
                    addIncludeToMap(group.name)
            }else{
        alert(status);
        }           
        });       
    }
};

Map.prototype.removeGroup = function(name){
    var self = this;
    var group = this.getGroupByName(name);
    if(group){
        $.post($SCRIPT_ROOT + '/_remove_group', {
            name: name
        }, function(status) {
            if(status == 1){
                var index = self.getGroupIndexByName(name);
                self.groups.splice(index, 1);
                
                var groupSelect = $("#" + self.workspace.groupSelect);
                groupSelect.find("option[value='" + group.name + "']").remove();
                $('#'+self.workspace.groupOl).find("li.ui-selected").remove();
                groupSelect.trigger("change");
                groupSelect.trigger('chosen:updated');

                //Remove include statement in the map element
                if(self.type == "Standard")
                    removeIncludeFromMap(group.name)
            }
        });       
    }
};

Map.prototype.displayComponents = function(){
    mapEditor.setValue(this.map);
    scaleEditor.setValue(this.scales);
    variableEditor.setValue(this.variables);
    symbolEditor.setValue(this.symbols);
    fontEditor.setValue(this.fonts);
    projectionEditor.setValue(this.projections);
    readmeEditor.setValue(this.readme);

    if (this.type == "Basemaps"){
        $("a[href='#scale-tab']").html("Config");
    } else{
        $("a[href='#scale-tab']").html("Scales");
    }

    $(".group-button").button("enable");
    this.displayGroups();
};

Map.prototype.displayGroups = function(silent){
    if (this.type == "Basemaps" || this.type == "Standard"){
        $("#btn_change_group_order").button("disable");
    }

    var groupSelect = $("#" + this.workspace.groupSelect);
    for(var i = 0; i < this.groups.length; i++){
        groupSelect.append($("<option></option>").attr("value", this.groups[i].name).text(this.groups[i].name));
    }
    groupSelect.trigger("chosen:updated");
    var self = this;
    
    groupSelect.change(function(e){
        if(self.previousGroup){
            self.setGroupContent(self.previousGroup, groupEditor.getValue());
        }

        var group = self.getGroupByName(this.value);
        self.previousGroup = this.value;

        resizeEditors();
        if(group){
            groupEditor.setValue(group.content);
            groupEditor.clearHistory();
        } else{
            groupEditor.setValue("");
            groupEditor.clearHistory();
        }
        
        e.stopPropagation();
    })
    if(!silent){
        groupSelect.trigger("change");
        self.previousGroup = groupSelect.val();
        self.setGroupContent(self.previousGroup, groupEditor.getValue());    
    }

    //self.previousGroup = groupSelect.val();
    //self.setGroupContent(self.previousGroup, groupEditor.getValue());
}

Map.prototype.displayDescription = function(){
    $("#" + this.workspace.mapDescription).empty();
    var image = $('<div>').attr('id', 'map-preview-img-large');
    if(this.thumbnail){
        image.addClass('thumbnail-preview').css('background-image', 'url("' + this.thumbnail + '")');
    } else{
        image.addClass('default-preview');
    }
    //$("#" + this.workspace.mapDescription).append('<div id="map-preview-img-large"></div>');
    $("#" + this.workspace.mapDescription).append(image);
    $("#" + this.workspace.mapDescription).append("<p class=\"map-title\">" + this.name + "</p>");
    $("#" + this.workspace.mapDescription).append("<p class=\"map-description\">" + this.description + "</p>");
    $("#" + this.workspace.mapActions).show();
     
};

Map.prototype.setGroupContent = function(name, content){
    var group = this.getGroupByName(name);
    if(group){
        group.content = content;
    }
};

Map.prototype.updateComponents = function(){
    this.setGroupContent($("#" + this.workspace.groupSelect).val(), groupEditor.getValue());
    this.map = mapEditor.getValue();
    this.scales = scaleEditor.getValue();
    this.variables = variableEditor.getValue();
    this.symbols = symbolEditor.getValue();
    this.fonts = fontEditor.getValue();
    this.projections = projectionEditor.getValue();
    this.readme = readmeEditor.getValue();     
}

Map.prototype.commit = function(){
    self = this;
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
        url: $SCRIPT_ROOT + '/_commit',
        type: "POST",
        data: data,
        contentType:"application/json; charset=utf-8",
        dataType:"json",
        success: function(log) {
            scribeLog(log["result"]);
            if(!self.WMSLayer){
                self.open();
            } else{
                self.WMSLayer.redraw(true);
            }
            self.getResultingMapfile();
            self.saved = true;
        }
    })
}

Map.prototype.display = function(){
    if(this.errorMsg.length > 0){
        var error = "";
        for(var i = 0; i < this.errorMsg.length; i++){
            error += this.errorMsg[i] + "\n";
        }
        $("#" + this.workspace.logTextarea).val(error);
    } else{
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

        var extent = this.OLExtent.split(" ");    
        var projection = new OpenLayers.Projection(this.OLProjection);

        var mapOptions = {
            allOverlays: true,
            projection: projection,
            maxExtent: extent,
            scales:  scales,
            units: projection.getUnits()
        };

        var OLMap = new OpenLayers.Map(this.workspace.mapDiv, mapOptions);
    //Openlayers control to display the current zoom level
    var currentZoomControl = new OpenLayers.Control();
    OpenLayers.Util.extend(currentZoomControl, {
        draw: function(){
            OpenLayers.Control.prototype.draw.apply(this, arguments);
                if (!this.element) {
                    this.element = document.createElement("div");
                this.div.setAttribute("class","olControlNoSelect");
                this.div.setAttribute("class","olCurrentZoomLevelControl");
                    this.div.appendChild(this.element);
                }
                this.map.events.register( 'zoomend', this, this.updateZoomLevel);
                this.updateZoomLevel();
                return this.div;
         },
        updateZoomLevel: function(){
            var zoomlevel = this.map.getZoom();
             zoomlevel++;
            this.element.innerHTML = "Zoom level : "+zoomlevel;
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
                projection: projection
            }
        );

        OLMap.addLayers([WMSLayer]);
        OLMap.zoomToExtent(extent);
        
        this.OLMap = OLMap;
        this.WMSLayer = WMSLayer;
    }
}

Map.prototype.close = function(){
    if(this.OLMap){
        this.OLMap.destroy();
    }

    this.closeDataBrowser();
    this.clearGroups();

    this.clearComponents();
    this.workspace.openedMap = null;
}

Map.prototype.clearGroups = function(){
    var groupSelect = $("#" + this.workspace.groupSelect);
    groupSelect.find("option").remove();
    groupSelect.unbind("focus");
    groupSelect.unbind("change");
}

Map.prototype.destroy = function(callback){
    var self = this;
    $.post($SCRIPT_ROOT + '/_delete_map', {
        name: this.name
    }, function(status) {
        if(status == "1") {
            $("#" + self.workspace.mapList + " .ui-selected").remove();
            $("#" + self.workspace.mapDescription).html("");
        $("#" + self.workspace.mapActions).hide();
            var index = self.workspace.getMapIndexByName(self.name);
            self.workspace.maps.splice(index, 1);

            if(callback){
                callback.call(self);
            }
        }else {
            alert(status);
        }
    });   
}

Map.prototype.clearComponents = function(){
    groupEditor.setValue("");
    mapEditor.setValue("");
    scaleEditor.setValue("");
    variableEditor.setValue("");
    symbolEditor.setValue("");
    fontEditor.setValue("");
    projectionEditor.setValue("");
    readmeEditor.setValue("");
};

Map.prototype.displayGroupsIndex = function(){
    $("#" + this.workspace.groupOl).find("li").remove();

    var data = ""
    for(var i = 0; i < this.groups.length; i++){
    data += "<li class=\"ui-state-default\">" + this.groups[i].name + "</li>";
    }
    $("#" + this.workspace.groupOl).append(data);
    $("#" + this.workspace.groupOl).selectable();
    var self = this;
    $("#" + this.workspace.groupOl + " li").click(function(e){
    $("#" + self.workspace.groupOl + " li").removeClass("map-selected");
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

Map.prototype.updateGroupOrder = function(){
    var self = this;
    var data = [];
    for(var i = 0; i < this.groups.length; i++){
        data.push(this.groups[i].name);
    }
    data = JSON.stringify(data);

    $.ajax({
        url: $SCRIPT_ROOT + '/_change_groups_index',
        type: "POST",
        data: data,
        contentType:"application/json; charset=utf-8",
        dataType:"json",
        success: function(status) {
            var selected = $("#" + self.workspace.groupSelect).val();
            var content = groupEditor.getValue();
            self.clearGroups();
            self.displayGroups(true);
            $("#" + self.workspace.groupSelect).val(selected);
            $("#" + self.workspace.groupSelect).trigger('chosen:updated');
            groupEditor.setValue(content);
            self.commit();
        }
    })
}

Map.prototype.openDataBrowser = function(){
    var newDivName = "data-browser-child-" + this.name;
    $("#" + this.workspace.dataDiv).append($("<div>").attr("id", newDivName));
    $("#" + newDivName).elfinder({
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

    $("#" + this.workspace.dataDiv).trigger("resize");
}

Map.prototype.closeDataBrowser = function(){ 
    if($("#" + this.workspace.dataDiv).children().length > 0){
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
    config['name'] = this.name;
    $.post($SCRIPT_ROOT + '/_configure_map', config, function(response) {
        if(response.status == 'ok' && response.description){
            self.description = response.description;
            self.displayDescription();    
        }
    });
}

Map.prototype.gitCommit = function(config, callback){
    var self = this;
    config['name'] = this.name;

    $.post($SCRIPT_ROOT + '/_git_commit_map', config, function(response) {
        callback.call(null, response);

        if(response.status == 'ok'){
            self.open();   
        }
    });
}

Map.prototype.gitPull = function(config, callback){
    var self = this;
    config['name'] = this.name;
    
    $.post($SCRIPT_ROOT + '/_git_pull_map', config, function(response) {
        callback.call(null, response);

        if(response.status == 'ok'){
            self.open();
        }
    });
 
}

Map.prototype.gitClone = function(config, callback){
    var self = this;
    config['name'] = this.name;
    $.post($SCRIPT_ROOT + '/_git_clone_map', config, function(response) {
        if(response.status ==  'ok'){
            self.workspace.maps.push(self);
            self.workspace.displayMaps();
            $("#" + self.workspace.mapActions).hide();

            self.groups = [];
            self.open(self.commit);
        } else{
            self.destroy();
        }
        callback.call(null, response);
    });
}

Map.prototype.getConfiguration = function(callback){
    var data = {name: this.name};
    
    $.post($SCRIPT_ROOT + '/_get_config', data, function(response) {
       callback.call(null, response);
    });
}

Map.prototype.getResultingMapfile = function(){
    var self = this;
    $.getJSON($SCRIPT_ROOT + '/_load_mapfile_generated', {
    mapToEdit: this.name
    }, function(data) {
        $("#" + self.workspace.resultTextarea).val(data["text"]);
    });
}

Map.prototype.getDebug = function(){
    var self = this;
    $.getJSON($SCRIPT_ROOT + '/_load_debug', {
    }, function(data) {
    $("#" + self.workspace.debugTextarea).val(data.text);
    });    
}


