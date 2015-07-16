ScribeUI.Workspace = function(name, options){
    this.name = name;

    this.maps = [];

    this.selectedMap = null;

    if(options){
	    this.password = options.password ? options.password : this.password;
        this.workspaceManage = options.workspaceManage ? options.workspaceManage : null;
        this.workspacePassword = options.workspacePassword ? options.workspacePassword : null;
    }

    this.maps = []

    this.pointsOfInterest = [];
    this.openedMap = null;
};

ScribeUI.Workspace.prototype.open = function(){
    this.getMaps();
	ScribeUI.Workspace.onWorkspaceOpened();
};

ScribeUI.Workspace.prototype.refresh = function(){
    this.getMaps();
	ScribeUI.Workspace.onWorkspaceOpened();

    ScribeUI.UI.manager.mapActions().hide();
    $('.wms-url-container').hide()
}

ScribeUI.Workspace.prototype.createMap = function(data){
    var self = this;
    $.post($API + '/maps/new', data, function(response) {
        if(response.status == 1){
            self.refresh();
        }
        else alert(response.errors[0]);
    });
};

ScribeUI.Workspace.prototype.importMap = function(data){
    var self = this;
    ScribeUI.Map.checkLogs(ScribeUI.UI.manager.importMap.logs(), 'import', 0);
    $.ajax({
         url: $API + '/maps/import',
         data: data,
         cache: false,
         contentType: false,
         processData: false,
         type: 'POST',
         success: function(response){
             if(response.status == 1){
                 $("#import-status").text("Complete")
                 $("#import-status").addClass("import-complete");
                 ScribeUI.workspace.refresh();
             }
             else alert(response.errors[0]);
         },
         error: function(XMLHttpRequest, textStatus, errorThrown){
             $("#import-status").text("Error")
             var message = XMLHttpRequest.statusText;
             if(XMLHttpRequest.status == 413){
                 message += "\nTry adding 'LimitRequestBody 0' to your apache config";
             }
             alert(message);
             clearTimeout(ScribeUI.Map.logsTimer);
         }
    });
}

ScribeUI.Workspace.prototype.cloneMap = function(data){
    var self = this;

    $.post($API + '/maps/clone', data, function(response) {
        ScribeUI.UI.manager.git.cloneLogs().val(response.logs);
        if(response.status == 1){
            self.refresh();
        }
    });
};

ScribeUI.Workspace.prototype.deleteMap = function(map, callback){
    var self = this;

    $.post($API + '/maps/delete/' + map.id, {}, function(response) {
        if(response.status == 1){
            if(self.openedMap && map.name == self.openedMap.name){
                self.openedMap.close();
            }

            self.refresh();
        }
        else{
            alert(response.errors);
        }
    });
};

ScribeUI.Workspace.prototype.create = function(){
    var self = this;
    $.post($SCRIPT_ROOT + '/_create_new_ws', {
        name: this.name,
        password: this.password
    }, function(status) {
        if(status == "1") {
            self.display();
            self.open();
        }else {
            alert(status);
        }
    });
};

ScribeUI.Workspace.prototype.getMaps = function(){
    var self = this;

    this.selectedMap = null;

    $.post($API + '/workspace/maps', {
        name: this.name,
    }, function(response) {
        if(response.status == 1){
            self.maps = [];

            $.each(response.maps, function(index, map){
                var options = $.extend(map, {
                    workspace: self
                });
                self.maps.push(new ScribeUI.Map(options));
            });

            self.displayMaps(self.maps);
            //closeWorkspacePopup({"workspaceManage": self.workspaceManage});
            //$('#'+self.workspaceManage+' .workspace-errors').hide();
        } /*else {
            $('#'+self.workspaceManage+' .workspace-errors').show();
            $('#'+self.workspaceManage+' .workspace-errors .error').html(data);
        }*/
    });
};

ScribeUI.Workspace.prototype.getMapByName = function(name){
    for(var i = 0; i < this.maps.length; i++){
        if(this.maps[i].name == name){
            return this.maps[i];
        }
    }
    return null;
};

ScribeUI.Workspace.prototype.getMapByID = function(id){
    for(var i = 0; i < this.maps.length; i++){
        if(this.maps[i].id == id){
            return this.maps[i];
        }
    }
    return null;
};

ScribeUI.Workspace.prototype.getMapIndexByName = function(name){
    for(var i = 0; i < this.maps.length; i++){
        if(this.maps[i].name == name){
            return i;
            break;
        }
    }
    return null;
};

ScribeUI.Workspace.prototype.getPointsOfInterest = function(callback){
    var self = this;
    $.post($SCRIPT_ROOT + '/_get_pois', {
    }, function(data) {
    if (data){
        var pois = [];
        $.each(data.pois, function(key, poi){
                var oPoi = new POI(poi.name, poi.lon, poi.lat, poi.scale);
                oPoi["workspace"] = self;
        pois.push(oPoi);

        });

            for(var i = 0; i < pois.length; i++){
            self.pointsOfInterest.push(pois[i]);
            }

        if(callback){
        callback.call(self)
        }
    }
    });
};

ScribeUI.Workspace.prototype.getPointOfInterestByName = function(name){
    for(var i = 0; i < this.pointsOfInterest.length; i++){
    if(this.pointsOfInterest[i].name == name){
        return this.pointsOfInterest[i];
        break;
    }
    }
    return null;
};

ScribeUI.Workspace.prototype.addPointOfInterest = function(name){
    var self = this;

    var center = this.openedMap.OLMap.getCenter();
    var projection = this.openedMap.OLMap.getProjection();
    var lonLat = center.transform(new OpenLayers.Projection(projection.toUpperCase()), new OpenLayers.Projection("EPSG:4326"));
    var scale = this.openedMap.OLMap.getScale();

    var poi = new POI(name, lonLat.lon, lonLat.lat, scale);
    poi["workspace"] = this;

    $.post($SCRIPT_ROOT + '/_add_poi', {
        name: name,
        lon: lonLat.lon,
        lat: lonLat.lat,
        scale: scale
    }, function(status) {
    //self.pointsOfInterest.push(poi);
    });
    self.pointsOfInterest.push(poi);
    this.displayPointsOfInterest();
};

ScribeUI.Workspace.prototype.displayMaps = function(maps){
    var self = this;

    this.clearMaps();

    ScribeUI.UI.manager.mapActions().find('button').button('enable');
    ScribeUI.UI.manager.mapsList().empty();

    $.each(maps, function(index, map){
        self.displayThumbnail(map);
    });

    ScribeUI.UI.manager.mapsList().selectable({
        selected: function(e){
            var li = $(this).find(".ui-selected");
            self.selectedMap = self.getMapByName(li.text());

            if(self.selectedMap){
                self.selectedMap.displayDescription();
            }

            if(li.find('.default-preview').length > 0){
                li.addClass('li-default-thumbnail');
            }
        }
    });
};

ScribeUI.Workspace.prototype.displayThumbnail = function(map){
    var li = $('<li>').addClass('map-preview');
    var image = $('<div>').addClass('map-preview-img').appendTo(li);
    var name = $('<span>').addClass('map-preview-name').text(map.name).appendTo(li);

    if(map.thumbnail_url){
        image.addClass('thumbnail-preview').css('background-image', 'url("' + map.thumbnail_url + '")');
    } else{
        image.addClass('default-preview');
    }
    ScribeUI.UI.manager.mapsList().append(li);
};

ScribeUI.Workspace.prototype.displayPointsOfInterest = function(){
    this.clearPointsOfInterest();

    for(var i = 0; i < this.pointsOfInterest.length; i++){
       $("#" + this.poiSelect).append($("<option></option>").attr("value", this.pointsOfInterest[i].name).text(this.pointsOfInterest[i].name));
    }

    $("#" + this.poiSelect).trigger('chosen:updated');
};

ScribeUI.Workspace.prototype.display = function(){
    var select = $("#" + this.workspaceSelect);
    select.append($("<option></option>").attr("value", this.name).text(this.name));
    select.val(this.name);
};

ScribeUI.Workspace.prototype.close = function(){
    if(this.openedMap){
        this.openedMap.close();
    }

    this.clearMaps();
    delete this;
};

ScribeUI.Workspace.prototype.destroy = function(callback){
    var self = this;
    $.post($SCRIPT_ROOT + '/_delete_ws', {
        name: this.name,
        password: this.password
    }, function(status) {
        if(status == "1") {
            $("#" + self.workspaceSelect + " option[value=" + self.name + "]").remove();
            $('#'+self.workspacePassword).val('');
            if(callback){
                callback.call(self);
            }
            $("#" + self.workspaceSelect).trigger('chosen:updated');
        }else {
            alert(status);
        }
    });
};

ScribeUI.Workspace.prototype.clearMaps = function(){
    this.selectedMap = null;
    ScribeUI.UI.manager.mapDescription().html('');
    ScribeUI.UI.manager.mapActions().find('button').button('disable');
};

ScribeUI.Workspace.prototype.clearPointsOfInterest = function(){
     $("#" + this.poiSelect).find("option").remove();
};

// static function
/*ScribeUI.Workspace.prototype.deleteWorkspace(options){
    var msg = 'Are you sure you want to delete this workspace?';
    var div = $("<div>" + msg + "</div>");

    var name = $("#" + options.workspaceSelect).val();
    if(name != null){
        div.dialog({
            title: "Confirm",
            resizable: false,

            buttons: [{
                 text: "Yes",
                 click: function () {
                    var name = $("#" + options.workspaceSelect).val();
                    var password = $("#" + options.workspacePassword).val();
                    options.password = password;

                    if(_workspace && _workspace.name == name){
                        _workspace.destroy(_workspace.close);
                    } else{
                        var workspace = new ScribeUI.Workspace(name, options);
                        workspace.destroy();
                    }
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
}*/
/*ScribeUI.openWorkspace = function(options){
    var name = $("#" + options.workspaceSelect).val();
    var password = $("#" + options.workspacePassword).val();
    options["password"] = password;

    if(_workspace){
        _workspace.close();
    }

    _workspace = new ScribeUI.Workspace(name, options);
    if(_workspace.open())
        return true;
    else return false;

}*/


ScribeUI.Workspace.getWorkspaces = function(callback){
    $.get($API + '/workspaces/all', {}, function(response) {
        if(response.status == 1){
            if(callback){
                callback.call(null, response.workspaces);
            }
        }
    });
}

ScribeUI.Workspace.onWorkspaceOpened = function(){
    for(i in ScribeUI.plugins){
        if(ScribeUI.plugins[i].onWorkspaceOpened)
            ScribeUI.plugins[i].onWorkspaceOpened();
    }
}
