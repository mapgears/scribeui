function displayWorkspaces(select){
    $.post($SCRIPT_ROOT + '/_get_ws', {
    }, function(workspaces) {
        if(workspaces){
            var workspaceSelect =  $('#' + select);
            for(ws in workspaces){
               workspaceSelect.append($("<option></option>").attr("value", workspaces[ws]).text(workspaces[ws])); 
            }
        }
    });
}

function openNewWorkspaceWindow(options){
    $("#createws-form").dialog({
        autoOpen: false,
	resizable: false,
        height: 240,
        width: 300,
        modal: true,
        buttons: {
            "Create": function() {
                var name = $("#newws-name").val();
		var password = $("#newws-password").val();
                options["password"] = password;
                
                if(_workspace){
                    _workspace.close();
                }

		_workspace = new Workspace(name, options)

		_workspace.create();
                $(this).dialog("close");
            },
            Cancel: function() {
                $(this).dialog("close");
            }
        },
        close: function() {}
    }).dialog("open");
}

function deleteWorkspace(options){
    var name = $("#" + options.workspaceSelect).val();
    var password = $("#" + options.workspacePassword).val();

    if(_workspace && _workspace.name == name){
        _workspace.destroy(_workspace.close);
    } else{
        var workspace = new Workspace(name, options);
        workspace.destroy();
    }
}

function openWorkspace(options){
    var name = $("#" + options.workspaceSelect).val();
    var password = $("#" + options.workspacePassword).val();
    
    options["password"] = password;

    if(_workspace){
        _workspace.close();
    }

    _workspace = new Workspace(name, options);
    _workspace.open();
}

function openNewMapWindow(){
    $("#newmap-template").empty();
    $("#newmap-template").append($("<option></option>").val("*default").text("*default"));

    $("#createmap-form").dialog({
        autoOpen: false,
	resizable: false,
        /*height: 520,*/
        width: 420,
        modal: true,
        buttons: {
            "Create": function() {
                var name = $("#newmap-name").val();
		var template = $("#newmap-template option:selected").val();
                var templateLocation = $("#newmap-templateLocation").val();
                var locationPassword = $("#newmap-locationPassword").val();
                var description = $("#newmap-description").val();

		var map = new Map(name, {
                    "description": description,
                    "workspace": _workspace,
                    "template": template,
                    "templateLocation": templateLocation ? templateLocation : "",
                    "locationPassword": locationPassword ? locationPassword : ""
                });

		map.create();
                $(this).dialog("close");
            },
            "+": function(){
                $("#newmap-ws").removeClass("hidden");
                $("#newmap-workspace-select").empty();
                displayWorkspaces("newmap-workspace-select");
                $("#newmap-refresh-button").click(function(e){
                    e.preventDefault();
                    e.stopPropagation();
                    var password = $("#newmap-workspace-password").val();
                    var options = {"password": password};
 
                    var workspace = new Workspace($("#newmap-workspace-select").val(), options);
                    workspace.getMaps(displayTemplates);    
                });
                
            },
            Cancel: function() {
                $("#newmap-ws").addClass("hidden");
                $(this).dialog("close");
            }
        },
        close: function() {
            $("#newmap-ws").addClass("hidden");
        }
    }).dialog("open");
}

function displayTemplates(){
    $("#newmap-template").empty();
    $("#newmap-template").append($("<option></option>").val("*default").text("*default"));
    for(var i = 0; i < this.maps.length; i++){
        $("#newmap-template").append($("<option></option>").val(this.maps[i].name).text(this.maps[i].name));
    }
}

function openMap(){
    var name = $("#map-table .map-selected").html();
    var map = _workspace.getMapByName(name);
    if(map){
        map.open();
    }
}

function deleteMap(){
    var name = $("#map-table .map-selected").html();
    var map = _workspace.getMapByName(name);
    map.workspace = _workspace;

    map.backup();
}

function deleteMap(){
    var name = $("#map-table .map-selected").html();
    var map = _workspace.getMapByName(name);
    map.workspace = _workspace;

    if(_workspace.openedMap == map){
        map.destroy(map.close);
    } else{
        map.destroy();
    }
}

function createNewGroup(){
    $("#creategroup-form").dialog({
        autoOpen: false,
	resizable: false,
        height: 180,
        width: 300,
        modal: true,
        buttons: {
            "Create": function() {
                var name = $("#newgroup-name").val();

		_workspace.openedMap.createGroup(name);
                $(this).dialog("close");
            },
            Cancel: function() {
                $(this).dialog("close");
            }
        },
        close: function() {}
    }).dialog("open");
}

function deleteGroup(){
    var name = $("#" + _workspace.groupSelect).val();
    _workspace.openedMap.removeGroup(name);
}

function openGroupOrderWindow(){
    _workspace.openedMap.displayGroupsIndex();
    $("#grouporder-form").dialog({
        autoOpen: false,
	resizable: false,
        height: 300,
        width: 300,
        modal: true,
        buttons: {
            "Apply": function() {
                _workspace.openedMap.updateGroupOrder();
                $(this).dialog("close");
            },
            "+": function(){
                var group = $("#" + _workspace.groupTable + " td.map-selected");
                var bumped = $("#" + _workspace.groupTable + " td.map-selected").parents().prev().find("td");
                
                var groupName = group.text();
                var bumpedName = bumped.text();

                if(groupName && bumpedName){
                    _workspace.openedMap.raiseGroupIndex(groupName);

                    bumped.text(groupName);
                    group.text(bumpedName);

                    group.removeClass("map-selected");
	            bumped.addClass("map-selected");
                }
            },
            "-": function(){
                var group = $("#" + _workspace.groupTable + " td.map-selected");
                var bumped = $("#" + _workspace.groupTable + " td.map-selected").parents().next().find("td");
                
                var groupName = group.text();
                var bumpedName = bumped.text();

                if(groupName && bumpedName){
                    _workspace.openedMap.lowerGroupIndex(groupName);

                    bumped.text(groupName);
                    group.text(bumpedName);

                    group.removeClass("map-selected");
	            bumped.addClass("map-selected");
                }
                
            },
            Cancel: function() {
                $(this).dialog("close");
            }
        },
        close: function() {}
    }).dialog("open");
}

function displayDataBrowser(){
    if(_workspace){
        if(_workspace.openedMap){
            _workspace.openedMap.openDataBrowser();
        }
    }
}

function zoomToPOI(){
    if(_workspace){
        if(_workspace.openedMap){
            var name = $("#" + _workspace.poiSelect).val();
            var poi = _workspace.getPointOfInterestByName(name);
            poi.zoomTo();
        }
    }    
}

function addPOI(){
     if(_workspace){
        if(_workspace.openedMap){
            $("#addpoi-form").dialog({
                autoOpen: false,
	        resizable: false,
                height: 180,
                width: 300,
                modal: true,
                buttons: {
                    "Add": function() {
                        var name = $("#newpoi-name").val();
		        _workspace.addPointOfInterest(name);
                        $(this).dialog("close");
                    },
                    Cancel: function() {
                        $(this).dialog("close");
                    }
                },
                close: function() {}
            }).dialog("open");
        }
    } 
}

function unregisterDebug(){
    if(_workspace.openedMap.OLMap != null){
        _workspace.openedMap.OLMap.events.unregister('moveend', _workspace.openedMap.OLMap, onMapMoveEnd);
    }
}

function registerDebug(){
    if(_workspace.openedMap.OLMap != null){
         _workspace.openedMap.OLMap.events.on({
	     "moveend": onMapMoveEnd
         });
     }
}

function clearDebug(){
    $.getJSON($SCRIPT_ROOT + '/_clear_debug', {
    }, function(data) {
        $('#txt-debug').val("");
    });
}

function displayDebug(){
    if($('.olTileImage').css('visibility')=='hidden'){
	onMapMoveEnd();
    }else{
        _workspace.openedMap.getDebug();
    }
}


function onMapMoveEnd() {
    setTimeout(function(){displayDebug()},1000);
}
