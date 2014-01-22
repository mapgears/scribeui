jQuery.fn.exists = function(){return this.length>0;}

function displayWorkspaces(select){
    $.post($SCRIPT_ROOT + '/_get_ws', {
    }, function(workspaces) {
        if(workspaces){
            var workspaceSelect =  $('#' + select);
            for(ws in workspaces){
               workspaceSelect.append($("<option></option>").attr("value", workspaces[ws]).text(workspaces[ws])); 
            }
            workspaceSelect.trigger("chosen:updated");
        }
    });
}

function openNewWorkspaceWindow(options){
    $("#createws-form").dialog({
        autoOpen: false,
        resizable: false,
        width: options.popupWidth,
        height:options.popupHeight,
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
        close: function(e) {
            var inputs = $(this).find('input');
            $(inputs).val('');
        }
    }).dialog("open");
}

function deleteWorkspace(options){
    var msg = 'Are you sure you want to delete this workspace?';
    var div = $("<div>" + msg + "</div>");

    var name = $("#" + options.workspaceSelect).val();
    if(name != null){
        div.dialog({
            title: "Confirm",
            resizable: false,
            
            width: options.popupWidth,
            height:options.popupHeight,

            buttons: [{
                 text: "Yes",
                 click: function () {
                    var name = $("#" + options.workspaceSelect).val();
                    var password = $("#" + options.workspacePassword).val();
                    options.password = password;

                    if(_workspace && _workspace.name == name){
                        _workspace.destroy(_workspace.close);
                    } else{
                        var workspace = new Workspace(name, options);
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
}

function openWorkspace(options){
    var name = $("#" + options.workspaceSelect).val();
    var password = $("#" + options.workspacePassword).val();
    options["password"] = password;

    if(_workspace){
        _workspace.close();
    }

    _workspace = new Workspace(name, options);
    if(_workspace.open())
        return true;
    else return false;
   
}

function openWorkspacePopup(options){
    displayWorkspaces(options.workspaceSelect);
    var dClass = 'no-close';
    if(_workspace){
            dClass = ''; // If there is a workspace opened, we allow closing the window
    }
    $('#'+options.workspaceManage).dialog({
        modal:true,
        width: options.popupWidth,
        height:options.popupHeight,
        resizable: false,
        dialogClass: dClass,
        modal:true,
        buttons:{
            "New Workspace": function(e){ 
                openNewWorkspaceWindow(options)
            },
            "Open Workspace": function(e){
                    openWorkspace(options)
            },
            "Delete Workspace": function(e){
                deleteWorkspace(options);
            }
        }
    })
}

function closeWorkspacePopup(options){
    $('#'+options.workspaceManage).dialog('close');
}
function getTemplatesOfType(type){
    $.post($SCRIPT_ROOT + '/_export_map', {
        type: type
    }, function(url) {
        if(templates){
            for(temp in templates){
                $("#newmap-template").append($("<option></option>").val(templates[temp]).text(templates[temp]));
            }
            $('#newmap-template').trigger('chosen:updated'); 
        }
    });
}

function openNewMapWindow(){
    displayTemplates("templates", $("#newmap-type").val());
    displayTemplates("", $("#newmap-type").val());

    $("#createmap-form").dialog({
        autoOpen: false,
        resizable: false,
        width: _workspace.popupWidth,
        height:_workspace.popupHeight,
        modal: true,
        buttons: {
            "Create": function() {
                var name = $("#newmap-name").val();
                var type = $("#newmap-type option:selected").val();
                var template = $("#newmap-template option:selected").val();
                var templateLocation = $("#newmap-workspace-select").val();
                var locationPassword = $("#newmap-workspace-password").val();
                var description = $("#newmap-description").val();

                var map = new Map(name, {
                    "type": type,
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
                $("#newmap-ws").removeClass("invisible");
                displayTemplates("templates", $("#newmap-type").val());

                $("#newmap-workspace-select").empty();
                $("#newmap-workspace-select").append($("<option></option>").attr("value", " ").text(" "));
                displayWorkspaces("newmap-workspace-select");
                $("#newmap-workspace-select").unbind('change');
                $("#newmap-workspace-select").bind('change', function(){
                    var password = $("#newmap-workspace-password").val();
                    var workspaceSelect = $("#newmap-workspace-select").val()
                    displayTemplates("templates", $("#newmap-type").val());
                    displayTemplates(workspaceSelect, $("#newmap-type").val());  
                });
                
            },
            Cancel: function() {
        $("#newmap-workspace-select").empty();
                $("#newmap-ws").addClass("invisible");
                $(this).dialog("close");
            }
        },
        close: function() {
        $("#newmap-workspace-select").empty();
            $("#newmap-ws").addClass("invisible");
        }
    }).dialog("open");
}

function displayTemplates(ws_name, type){
    $("#newmap-template").empty();
    $.post($SCRIPT_ROOT + '/_get_templates', {
        ws_name: ws_name,
        type: type
    }, function(templates) {
        if(templates){
            for(temp in templates){
                $("#newmap-template").append($("<option></option>").val(templates[temp]).text(templates[temp]));
            }
            $("#newmap-template").trigger("chosen:updated");
        }
    });
}

function openMap(){
    var name = $("#"+ _workspace.mapList +" .ui-selected").text();
    var map = _workspace.getMapByName(name);
    if(map){
        map.open();
    }
}

function deleteMap(){
    var msg = 'Are you sure you want to delete this map?';
    var div = $("<div class=\"scribe-dialog\">" + msg + "</div>");
    
    var name = $("#map-list .ui-selected").text();
    if(name != null){
        div.dialog({
            title: "Confirm",
            resizable: false,
            width: _workspace.popupWidth,
            height:_workspace.popupHeight,
            buttons: [{
                 text: "Yes",
                 click: function () {
                    
                    var map = _workspace.getMapByName(name);
                    map.workspace = _workspace;

                    if(_workspace.openedMap == map){
                        map.destroy(map.close);
                    } else{
                        map.destroy();
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
}

function exportMap(){
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
                "Export": function() {
                    var checkBoxes = $("input[name='exportComponents']");
                    var components = {};

                    $.each(checkBoxes, function() {
                        if ($(this).attr('checked')){
                            components[this.value] = 1;    
                        } else {
                            components[this.value] = 0;
                        }
                    });
            
                    var mapToExport = new Map(name);

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

function cloneMap(){
    $("#clonemap-form").dialog({
        autoOpen: false,
        resizable: false,
        width: _workspace.popupWidth,
        height:_workspace.popupHeight,
        modal: true,
        buttons: {
            "Clone": function() {
                var name = $("#git-clone-name").val();
                var type = $("#git-clone-type option:selected").val();
                var description = $("#git-clone-description").val();
                var gitURL = $("#git-clone-url").val();
                var gitUser = $("#git-clone-user").val();
                var gitPassword = $("#git-clone-password").val();

                var map = new Map(name, {
                    "type": type,
                    "description": description,
                    "workspace": _workspace,
                    "template": "*Dummy"
                });

                var config = {
                    gitURL: gitURL,
                    gitUser: gitUser,
                    gitPassword: gitPassword  
                }

                map.create(config, displayCloneLogs);

                //$(this).dialog("close");
            },
            Cancel: function() {
                $(this).dialog("close");
            }
        },
        close: function() {
            $(this).find('input').val('');
            $(this).find('textarea').val('');    
        }
    }).dialog("open");
}

function configureMap(){
    var name = $("#map-list .ui-selected").text();
    var map = _workspace.getMapByName(name);
    var config = map.getConfiguration(displayConfiguration);

    if (name){
        $("#configuremap-form").dialog({
            autoOpen: false,
            resizable: false,
            width: _workspace.popupWidth,
            height:_workspace.popupHeight,
            modal: true,
            buttons: {
                "Save": function() {
                    var gitURL = $("#git-url").val();
                    var gitUser = $("#git-user").val();
                    var gitPassword = $("#git-password").val();
                    var description = $("#configure-description").val();

                    var config = {
                        gitURL: gitURL,
                        gitUser: gitUser,
                        gitPassword: gitPassword,
                        description: description    
                    }

                    map.configure(config);

                    $(this).dialog("close");
                },
                Cancel: function() {
                    $(this).dialog("close");
                }
            },
            close: function() {
                $(this).find('input').val('');    
            }
        }).dialog("open");
    }
}

function displayConfiguration(config){
    $("#git-url").val(config.gitURL);
    $("#git-user").val(config.gitUser);
    $("#git-password").val(config.gitPassword);
    $("#configure-description").val(config.description);
}

function commitMap(){
    var name = $("#map-list .ui-selected").text();
    if(_workspace.openedMap && _workspace.openedMap.name != name){
        var map = _workspace.openedMap;
    } else{
        var map = _workspace.getMapByName(name);
    }

    if (name){
        $("#commitmap-form").dialog({
            autoOpen: false,
            resizable: false,
            width: _workspace.popupWidth,
            height:_workspace.popupHeight,
            modal: true,
            buttons: {
                "Commit": function() {
                    var message = $("#git-message").val();
                    var gitUser = $("#git-commit-user").val();
                    var gitPassword = $("#git-commit-password").val();

                    var config = {
                        message: message,
                        gitUser: gitUser,
                        gitPassword: gitPassword
                    }
                    map.gitCommit(config, displayCommitLogs);

                    //$(this).dialog("close");
                },
                Cancel: function() {
                    $(this).dialog("close");
                }
            },
            close: function() {
                $(this).find('input').val('');
                $(this).find('textarea').val('');    
            }
        }).dialog("open");
    }
}

function pullMap(){
    var name = $("#map-list .ui-selected").text();
    if(_workspace.openedMap && _workspace.openedMap.name != name){
        var map = _workspace.openedMap;
    } else{
        var map = _workspace.getMapByName(name);
    }

    if (name){
        $("#pullmap-form").dialog({
            autoOpen: false,
            resizable: false,
            width: _workspace.popupWidth,
            height:_workspace.popupHeight,
            modal: true,
            buttons: {
                "Pull": function() {
                    var changes = $('input[name="changes"]:radio:checked', '#pullmap-form').val();
                    var gitUser = $("#git-pull-user").val();
                    var gitPassword = $("#git-pull-password").val();

                    var config = {
                        changes: changes,
                        gitUser: gitUser,
                        gitPassword: gitPassword
                    }

                    map.gitPull(config, displayPullLogs);

                    //$(this).dialog("close");
                },
                Cancel: function() {
                    $(this).dialog("close");
                }
            },
            close: function() {
                $(this).find('textarea').val('');
                $(this).find('input[type="text"]').val('');    
            }
        }).dialog("open");
    }
}

function displayCommitLogs(e){
    $("#git-logs").val(e.log);
}

function displayCloneLogs(e){
    $("#git-clone-logs").val(e.log);
}


function displayPullLogs(e){
    $("#git-pull-logs").val(e.log);
}
function createNewGroup(){
    $("#creategroup-form").dialog({
        autoOpen: false,
    resizable: false,
        width: _workspace.popupWidth,
        height:_workspace.popupHeight,
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

function deleteGroup(options){
    options = (options) ? options : {};
    if(options.hasOwnProperty("mapType")){
        if(options.mapType == "Scribe"){
            $(".to-be-deleted").each(function(i){
                var name = $(this).text();
                _workspace.openedMap.removeGroup(name);
            });
        }else if(options.mapType == "Standard"){
            var name = $("#group-select option:selected").text();
            var r = confirm("Are you sure you want to remove the group "+name+"?");
            _workspace.openedMap.removeGroup(name);
        }
    }
}
function openGroupOrderWindow(){
    _workspace.openedMap.displayGroupsIndex();

    $("#grouporder-form").dialog({
        autoOpen: false,
        resizable: false,
        width: _workspace.popupWidth,
        height:_workspace.popupHeight,
        modal: true,
        buttons: [
        {
            text: "+",
            showText: false,
            'class': 'btn-group-first',
            icons: { primary: 'ui-icon-plus'},
            click: function(){
                createNewGroup();
            }
        },
        {
            text: "Delete",
            showText: false,
            'class': 'btn-group-last',
            icons: { primary: 'ui-icon-trash'},
            click: function(){
                    var group = $("#" + _workspace.groupOl + " .ui-selected");
                    group.addClass('to-be-deleted');
            }
        },

        {
            text: '+',
            showText: false,
            'class': 'btn-group-first',
            icons: { primary: 'ui-icon-carat-1-s'},
            click: function(){
                var group = $("#" + _workspace.groupOl + " .ui-selected");
                var bumped = $("#" + _workspace.groupOl + " .ui-selected").next();
                
                var groupName = group.text();
                var bumpedName = bumped.text();

                if(groupName && bumpedName){
                    _workspace.openedMap.raiseGroupIndex(groupName);

                    bumped.text(groupName);
                    group.text(bumpedName);

                    group.removeClass("ui-selected");
                bumped.addClass("ui-selected");
                }
            }
        },
        {
            text: '-',
            showText: false,
            'class': 'btn-group-last',
            icons: { primary: 'ui-icon-carat-1-n'},
            click: function(){
                var group = $("#" + _workspace.groupOl + " .ui-selected");
                var bumped = $("#" + _workspace.groupOl + " .ui-selected").prev();
                
                var groupName = group.text();
                var bumpedName = bumped.text();

                if(groupName && bumpedName){
                    _workspace.openedMap.raiseGroupIndex(groupName);

                    bumped.text(groupName);
                    group.text(bumpedName);

                    group.removeClass("ui-selected");
                       bumped.addClass("ui-selected");
                }                
            }
        },
        {
            text: "Apply",
            'class': 'btn-group-first grouporder-btn-right',
            click:  function() {
                _workspace.openedMap.updateGroupOrder();
                deleteGroup({mapType:_workspace.openedMap.type});
                $(this).dialog("close");
            }
        },
        {
            text: "Cancel",
            'class': 'btn-group-last grouporder-btn-right',
            click: function() {
                $(this).dialog("close");
            }
        }],
        close: function() {}
    });

    $('.grouporder-btn-right').wrapAll('<div class="grouporder-btnset-right"></div>');

    $("#grouporder-form").dialog("open");
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
                width: _workspace.popupWidth,
                height:_workspace.popupHeight,
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
    $('#txt-debug').val("");
    $.getJSON($SCRIPT_ROOT + '/_clear_debug', {
    }, function(data) {
    });
}

function displayDebug(){
    if($('.olTileImage').filter(function(){ return this.style && this.style.visibility === 'hidden' }).length > 0){
    onMapMoveEnd();
    }else{
       _workspace.openedMap.getDebug();
    }
}


function onMapMoveEnd(){
    setTimeout(function(){displayDebug()},500);
}

/* layout functions */

function resizeEditors(){
    //$('#editor-tab').css("overflow","hidden");
    if( $('.secondary-wrap').is(':visible'))
        var remainingSpace = $('#editors-container').height() - $('.secondary-wrap').outerHeight();
    else var remainingSpace = $('#editors-container').height();
       var divTwo = $('.main-editor');
       var divTwoHeight = remainingSpace - (divTwo.outerHeight() - divTwo.height());
       divTwo.css('height', divTwoHeight + 'px');    
}
function openSecondaryPanel(value, editor){
    $('#secondary-editor > .tabcontent-small').hide();
    $('.secondary-wrap').hide();
    if(value != 'x'){
        $('.secondary-wrap').show();
        $('#'+value.substr(0, value.length-1)+'-tab').show();
           editor.refresh();
    }else{
         $('.secondary-wrap').hide();
    }
    resizeEditors();
}

function onMapOpened(){
    $('#group-edition-select').change(function(e){
        var editor = null;
        var val = this.value;
        switch(this.value){
            case 'map': 
                editor = mapEditor;
                val = 'maps';
                break;
            case 'scales': 
                editor = scaleEditor;
                break;
            case 'symbols': 
                editor = symbolEditor;
                break;
            case 'fonts': 
                editor = fontEditor;
                break;
            case 'projections': 
                editor = projectionEditor;
                break;
            case 'variables':
                editor = variableEditor;
                break;
            case 'readmes':
                editor = readmeEditor;
                break;
                
        }
        openSecondaryPanel(val, editor);
    });
    $('#txt-logs').val('');
    $('#txt-debug').val('');

    //Needed to prevent being able to ctrl-z to previous' map content
    groupEditor.clearHistory();
    mapEditor.clearHistory();
    variableEditor.clearHistory();
    scaleEditor.clearHistory();
    fontEditor.clearHistory();
    projectionEditor.clearHistory();
    readmeEditor.clearHistory();

    if(_workspace.openedMap.type == "Scribe"){
        $("#btn_delete_group").hide();
        $("#btn_change_group_order").show();
    }else if(_workspace.openedMap.type == "Standard"){
        $("#btn_delete_group").show();
        $("#btn_change_group_order").hide();
    }

    for(i in plugins){
        if(plugins[i].onMapOpened)
            plugins[i].onMapOpened();
    }
}
function onWorkspaceOpened(){
    for(plugin in plugins){
        if(plugin.onWorkspaceOpened)
            plugin.onWorkspaceOpened();
    }
}
function scribeLog(msg){
    if(msg.indexOf("**ERRORS**") != -1){
        if(!$('#logs').is(':visible'))
            $('#log-notification').show('pulsate', 1000);                
    }else{
        $('#log-notification').hide();                
    }
    $("#" + self.workspace.logTextarea).val(msg);
}

function removeIncludeFromMap(filename){
    for(var i=0; i<mapEditor.lineCount(); i++){
        if(mapEditor.getLine(i).indexOf("layers/"+filename+"'") !== -1){
            var line = mapEditor.getLine(i);
            mapEditor.removeLine(i);
            //Highlight for a short time:
            mapEditor.setLineClass(i, 'background', 'setextent-highlighted-line');
            mapEditor.setLineClass(i-1, 'background', 'setextent-highlighted-line');
            setTimeout(function(){
                mapEditor.setLineClass(i, 'background', '');
                mapEditor.setLineClass(i-1, 'background', '');
            }, 3000);
            break;
        }
    }
    _workspace.openedMap.commit();

}
function addIncludeToMap(filename){
    //Find the includes in the mapeditor
    lastinc = -1;
    openSecondaryPanel("maps", mapEditor);
    for(var i=0; i<mapEditor.lineCount(); i++){
        if(mapEditor.getLine(i).indexOf("INCLUDE") !== -1){
            lastinc = i;
        }else if(lastinc > -1){
            //We add the new file at the end of the include list
            var line = mapEditor.getLine((i-1));
            //TODO detect indentation 
            mapEditor.setLine((i-1), line+"\n    INCLUDE 'layers/"+filename+"'\n");
            //Highlight for a short time:
            mapEditor.setLineClass(i, 'background', 'setextent-highlighted-line');
            setTimeout(function(){
                mapEditor.setLineClass(i, 'background', '');
            }, 3000);
            break;
        }
    }
    _workspace.openedMap.commit();
}

/* 
name: string, Name of the tab
destinationSelector: jquery selector of the tab group, ex #main-tabs or #log-tabs
options: (optional) object
    onclick: function called when tab link is clicked
    position: string, where to add tab, possible values: last, first

Returns: The div element to be used as tab content
*/
function addTab(name, destinationSelector, options){
    options = (options) ? options : {};
    var onclick = options.onclick || null;
    var position = options.position || 'last';
    if($(destinationSelector).exists()){
        var link = $('<a href="#'+name+'-tab">'+name+'</a>');
        if(onclick) link.bind('click', onclick);

        var li = $('<li class="tab-large"></li>');
        li.append(link);
                
        if(position == 'last')
            $(destinationSelector+' .tabheader').append(li)
        if(position == 'first')
            $(destinationSelector+' .tabheader').prepend(li)
                var div = $('<div id="'+name+'-tab"></div>');
        $(destinationSelector).append(div);
        $(destinationSelector).tabs('refresh');
        return div;
    }else return null;
}
/*
component: a jquery object
destinationSelector: jquery selector of the destination
options: (optional) object
    position: string, where to add tab, possible values: last, first

Returns: The component
*/

function addComponent(component, destinationSelector, options){
        options = (options) ? options : {};
    var position = options.position || 'last';
    if($(destinationSelector).exists()){
        if(position == 'last')
            $(destinationSelector).append(component)
        if(position == 'first')
            $(destinationSelector).prepend(component)
         return component;

    }else return null;
}
/* 
name: string, Name of the button
destinationSelector: jquery selector of the toolbar, ex editor-toolbar, tools-left or tools-right 
options: (optional) object
    onclick: function called when button is clicked
    position: string, where to add tab, possible values: last, first
    buttonid: string, id to give to the button

Returns: The button element
*/
function addButton(name, destinationSelector, options){
    options = (options) ? options : {};
    var onclick = options.onclick || null;
    var position = options.position || 'last';
    var buttonid = options.buttonid || name;
    if($(destinationSelector).exists()){
        button = $('<button id="'+buttonid+'">'+name+'</button>').button();
        button.click(onclick);
        return addComponent(button, destinationSelector, options)
    }else return null;
}

function addPlugin(plugin){
    plugins.push(plugin);
    plugin.init();
}

