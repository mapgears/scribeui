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

function openNewWorkspaceDialog(options){
    $("#createws-form").dialog({
        autoOpen: false,
        resizable: false,
        width: options.popupWidth,
        height: options.popupHeight,
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
            $(this).find('input').val('');
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
            
            //width: options.popupWidth,
            //height:options.popupHeight,

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
                openNewWorkspaceDialog(options)
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

function displayTemplates(templates){
    selectors.templateSelect().empty();

    $.each(templates, function(index, template){
        var option = $('<option>').val(template.name).text(template.name);
        selectors.templateSelect().append(option);
    });
    selectors.templateSelect().trigger('chosen:updated');    
}

function openNewMapDialog(){
    getTemplates('default', 'Scribe', null, function(templates){
        displayTemplates(templates);

        $("#createmap-form").dialog({
            autoOpen: false,
            resizable: false,
            modal: true,
            buttons: {
                "Create": function() {
                    var name = selectors.newMapName().val();
                    var type = selectors.newMapTypeSelect().val();
                    var template = selectors.templateSelect().val();
                    var templateWorkspace = selectors.templateWorkspaceSelect().val();
                    var templateWorkspacePassword = selectors.templateWorkspacePassword().val();
                    var description = selectors.newMapDescription().val();

                    workspace.createMap({
                        name: name,
                        type: type,
                        description: description,
                        template: template,
                        template_workspace: templateWorkspace ? templateWorkspace : 'default',
                        template_workspace_password: templateWorkspacePassword ? templateWorkspacePassword : ''
                    });

                    $(this).dialog("close");
                },
                "+": function(){
                    getWorkspaces(function(workspaces){
                        $("#newmap-ws").removeClass('invisible');

                        selectors.templateWorkspaceSelect().empty();
                        selectors.templateWorkspaceSelect().unbind('change');

                        $.each(workspaces, function(index, workspace){
                            var option = $('<option>').val(workspace.name).text(workspace.name);
                            selectors.templateWorkspaceSelect().append(option);
                        });
                        selectors.templateWorkspaceSelect().trigger('chosen:updated');

                        selectors.templateWorkspaceSelect().bind('change', function(){
                            var templateWorkspace = $(this).val();
                            var password = selectors.templateWorkspacePassword().val();
                            var type = selectors.newMapTypeSelect.val()

                            getTemplates(templateWorkspace, type, null, function(templates){
                                displayTemplates(templates);
                            }); 
                        });
                    });         
                },
                Cancel: function() {
                    $(this).dialog("close");
                }
            },
            close: function() {
                selectors.templateSelect().empty();
                selectors.templateWorkspaceSelect().empty();
                $("#newmap-ws").addClass("invisible");
                $('input').val('');
                $('textarea').val('');
            }
        }).dialog("open");

    });
}

function getTemplates(name, type, password, callback){
    var data = {
        name: name,
        type: type
    };

    if(password){
        data['password'] = password;
    }

    $.post($API + '/workspace/maps', data, function(response) {
        if(response.status == 1){
            if(callback){
                callback.call(null, response.maps);
            }
        }
    });    
}

function getWorkspaces(callback){
    $.get($API + '/workspaces/all', {}, function(response) {
        if(response.status == 1){
            if(callback){
                callback.call(null, response.workspaces);
            }
        }
    });    
}

function openMap(){
    var map = workspace.selectedMap;
    if(map){
        map.open();
    }
}

function deleteMap(){
    var msg = 'Are you sure you want to delete this map?';
    var div = $("<div class=\"scribe-dialog\">" + msg + "</div>");
    
    var name = workspace.selectedMap.name;

    if(name != null){
        div.dialog({
            title: "Confirm",
            resizable: false,
            buttons: [{
                 text: "Yes",
                 click: function () {
                    workspace.deleteMap(workspace.selectedMap);
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
    selectors.gitCloneLogs().val('');

    $("#clonemap-form").dialog({
        autoOpen: false,
        resizable: false,
        modal: true,
        buttons: {
            Clone: function() {
                var name = $("#git-clone-name").val();
                var type = $("#git-clone-type option:selected").val();
                var description = $("#git-clone-description").val();
                var gitURL = $("#git-clone-url").val();
                var gitUser = $("#git-clone-user").val();
                var gitPassword = $("#git-clone-password").val();

                selectors.gitCloneLogs().val('Processing request. This may take a few seconds.');

                workspace.cloneMap({
                    name: name,
                    type: type,
                    description: description,
                    git_url: gitURL,
                    user: gitUser,
                    password: gitPassword 
                });
            },
            Close: function() {
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
    var map = workspace.selectedMap;

    if(map){
        $("#git-url").val(map.git_url);
        $("#configure-url").val(map.url);
        $("#configure-description").val(map.description);

        $("#configuremap-form").dialog({
            autoOpen: false,
            resizable: false,
            modal: true,
            buttons: {
                Save: function() {
                    var gitURL = $("#git-url").val();
                    var description = $("#configure-description").val();

                    var config = {
                        git_url: gitURL,
                        description: description    
                    }

                    map.configure(config);

                    $(this).dialog("close");
                },
                Close: function() {
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
    $("#configure-url").val(config.url);
    $("#configure-description").val(config.description);
}

function commitMap(){
    selectors.gitCommitLogs().val('');

    var map = workspace.selectedMap;

    if (map){
        $("#commitmap-form").dialog({
            autoOpen: false,
            resizable: false,
            modal: true,
            buttons: {
                Commit: function() {
                    var message = $("#git-message").val();
                    var gitUser = $("#git-commit-user").val();
                    var gitPassword = $("#git-commit-password").val();

                    var data = {
                        message: message,
                        user: gitUser,
                        password: gitPassword
                    }

                    selectors.gitCommitLogs().val('Processing request. This may take a few seconds.');

                    map.gitCommit(data);
                },
                Close: function() {
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
    selectors.gitPullLogs().val('');

    var map = workspace.selectedMap;

    if (map){
        $("#pullmap-form").dialog({
            autoOpen: false,
            resizable: false,
            modal: true,
            buttons: {
                "Pull": function() {
                    var method = $('input[name="method"]:radio:checked', '#pullmap-form').val();
                    var gitUser = $("#git-pull-user").val();
                    var gitPassword = $("#git-pull-password").val();

                    var data = {
                        method: method,
                        user: gitUser,
                        password: gitPassword
                    }

                    selectors.gitPullLogs().val('Processing request. This may take a few seconds.');

                    map.gitPull(data);
                },
                Close: function() {
                    $(this).dialog("close");
                }
            },
            close: function() {
                $(this).find('textarea').val('');
                $(this).find('input[type="text"]').val('');
                $(this).find('input[type="password"]').val('');    
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
function openNewGroupDialog(){
    $("#creategroup-form").dialog({
        autoOpen: false,
        resizable: false,
        modal: true,
        buttons: {
            "Create": function() {
                var name = $("#newgroup-name").val();
                var group = workspace.openedMap.getGroupByName(name);
                //VALIDER AUSSI LE FORMAT DU GROUPE ET LA PRÉSENCE DE CARACTÈRES SPÉCIAUX
                if(group){
                    alert('A group with that name exists already');
                } else{
                    workspace.openedMap.groups.push({name: name, content: ''});
                    workspace.openedMap.newGroups.push(name);

                    selectors.groupSelect().append($('<option></option>').attr('value', name).text(name));
                    selectors.groupSelect().trigger('chosen:updated');

                    workspace.openedMap.displayGroupsList();

                    $(this).dialog('close');    
                }
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

function deleteGroup(groups){
    $.each(groups, function(index, group){
        _workspace.openedMap.removeGroup(group);
    });
}
function openGroupOrderDialog(){
    workspace.openedMap.displayGroupsList();
    workspace.openedMap.removedGroups = [];
    workspace.openedMap.newGroups = [];
    workspace.openedMap.updatedGroups = [];

    $("#grouporder-form").dialog({
        autoOpen: false,
        resizable: false,
        modal: true,
        buttons: [
        {
            text: "+",
            showText: false,
            'class': 'btn-group-first',
            icons: { primary: 'ui-icon-plus'},
            click: function(){
                var group = selectors.groupsList().find('.ui-selected');
                openNewGroupDialog();
            }
        },
        {
            text: "Delete",
            showText: false,
            'class': 'btn-group-last',
            icons: { primary: 'ui-icon-trash'},
            click: function(){
                var group = selectors.groupsList().find('.ui-selected');
                //workspace.openedMap.removedGroups.push(group.text());
                group.addClass('to-be-deleted');
            }
        },
        {
            text: '+',
            showText: false,
            'class': 'btn-group-first',
            icons: { primary: 'ui-icon-carat-1-s'},
            click: function(){
                var group = selectors.groupsList().find('.ui-selected');
                var bumped = group.next();
                
                var groupName = group.text();
                var bumpedName = bumped.text();

                if(groupName && bumpedName){
                    workspace.openedMap.raiseGroupIndex(groupName);

                    bumped.text(groupName);
                    group.text(bumpedName);

                    var bumpedClass = bumped.attr('class');
                    var groupClass = group.attr('class');

                    group.attr('class', bumpedClass).removeClass("ui-selected");
                    bumped.attr('class', groupClass).addClass("ui-selected");
                }
            }
        },
        {
            text: '-',
            showText: false,
            'class': 'btn-group-last',
            icons: { primary: 'ui-icon-carat-1-n'},
            click: function(){
                var group = selectors.groupsList().find('.ui-selected');
                var bumped = group.prev();
                
                var groupName = group.text();
                var bumpedName = bumped.text();

                if(groupName && bumpedName){
                    workspace.openedMap.raiseGroupIndex(groupName);

                    bumped.text(groupName);
                    group.text(bumpedName);

                    var bumpedClass = bumped.attr('class');
                    var groupClass = group.attr('class');

                    group.attr('class', bumpedClass);
                    bumped.attr('class', groupClass);
                }                
            }
        },
        {
            text: "Apply",
            'class': 'btn-group-first grouporder-btn-right',
            click:  function() {
                $(".to-be-deleted").each(function(){
                    workspace.openedMap.removedGroups.push($(this).text());
                });

                $("#grouporder-form li:not(.to-be-deleted)").each(function(){
                    workspace.openedMap.updatedGroups.push($(this).text());    
                })
                
                $(this).dialog("close");

                workspace.openedMap.setGroups();

                //workspace.openedMap.updateGroupOrder(function(){
                //    deleteGroup(groups);
                //});
                
            }
        },
        {
            text: "Cancel",
            'class': 'btn-group-last grouporder-btn-right',
            click: function() {
                $.each(this.newGroups, function(index, name){
                    workspace.openedMap.removedGroup(name);
                });

                $(this).dialog("close");
            }
        }],
        close: function() {}
    });

    $('.grouporder-btn-right').wrapAll('<div class="grouporder-btnset-right"></div>');

    $("#grouporder-form").dialog("open");
}

function displayDataBrowser(){
    if(workspace){
        if(workspace.openedMap){
            workspace.openedMap.openDataBrowser();
        }
    }
}

function zoomToPOI(){
    if(workspace && workspace.openedMap){
        var name = selectors.poiSelect().val();
        workspace.openedMap.zoomToPOI(name);
    }    
}

function addPOI(){
    if(workspace && workspace.openedMap){
        $("#addpoi-form").dialog({
            autoOpen: false,
            resizable: false,
            modal: true,
            buttons: {
                "Add": function() {
                    var name = $("#newpoi-name").val();
                    if(workspace.openedMap.getPOIByName(name)){
                        alert('A poi with that name exists already.');
                    } else{
                        workspace.openedMap.addPOI(name);    
                    }
                    
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

function unregisterDebug(){
    if(workspace.openedMap.OLMap != null){
        workspace.openedMap.OLMap.events.unregister('moveend', workspace.openedMap.OLMap, onMapMoveEnd);
    }
}

function registerDebug(){
    if(workspace.openedMap.OLMap != null){
        workspace.openedMap.OLMap.events.on({
            'moveend': onMapMoveEnd
        });
     }
}

function clearDebug(){
    selectors.debugPre().val('');

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
function openSecondaryPanel(value){
    $('#secondary-editor > .tabcontent-small').hide();
    $('.secondary-wrap').hide();
    if(value != 'groups'){
        $('.secondary-wrap').show();
        $('#' + value.substr(0, value.length-1) + '-tab').show();
           editors[value].refresh();
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
        $("#btn_change_group_order").show();
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

function removeIncludeFromMap(filename, commit){
    for(var i=0; i<mapEditor.lineCount(); i++){
        if(mapEditor.getLine(i).indexOf("layers/"+filename) !== -1){
            var line = mapEditor.getLine(i);
            mapEditor.removeLine(i);
            break;
        }
    }
    if(commit == undefined || commit == true){
        _workspace.openedMap.commit();    
    }

}
function addIncludeToMap(filename, commit){
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
            mapEditor.setLine((i-1), line+"\n    INCLUDE 'layers/"+filename+"'");
            //Highlight for a short time:
            //mapEditor.setLineClass(i, 'background', 'setextent-highlighted-line');
            //setTimeout(function(){
            //    mapEditor.setLineClass(i, 'background', '');
            //}, 3000);
            break;
        }
    }
    if(commit == undefined || commit == true){
        _workspace.openedMap.commit();
    }
}

function displayLineEditor(cm, line, text){
    $('#edit-line-content').val(text);

    $("#edit-line").dialog({
        autoOpen: false,
        resizable: false,
        modal: true,
        buttons: [
        {
            text: "Write",
            'class': 'btn-group-first grouporder-btn-right',
            click:  function() {
                cm.setLine(line, $('#edit-line-content').val());
                $(this).dialog("close");
            }
        },
        {
            text: "Close",
            'class': 'btn-group-last grouporder-btn-right',
            click: function() {
                $(this).dialog("close");
            }
        }],
        close: function() {
            $(this).find('textarea').val('');
        }
    }).dialog("open");   
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

