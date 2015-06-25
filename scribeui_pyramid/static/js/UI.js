ScribeUI.UI = new function(){}

ScribeUI.UI.init = function(){
    this.editor = {};
	this.editor.toolbar= function(){ return $('#editor-toolbar') };
	this.editor.groupSelect= function(){ return $('#group-select') };
	this.editor.editorSelect= function(){ return $('#editor-select') };
	this.editor.groupsList= function(){ return $('#groups-ol') };
	this.editor.mapfilePre= function(){ return $('#txt-result').data('mapfileOutputEditor') };
	this.logs= {};
	this.logs.logs = function(){ return $('#logs') };
	this.logs.tabs= function(){ return $("#log-tabs") };
	this.logs.pre= function(){ return $('#txt-logs') };
	this.logs.notification= function(){ return $('#log-notification') };
	this.logs.debugPre= function(){ return $('#txt-debug') };
    this.manager = {};
	this.manager.mapDescription= function(){ return $('#map-description') };
	this.manager.mapActions= function(){ return $('#map-actions') };
	this.manager.mapsList= function(){ return $('#maps-list') };
	this.manager.newMap = {};
	this.manager.newMap.name= function(){ return $('#newmap-name') };
	this.manager.newMap.typeSelect= function(){ return $('#newmap-type') };
	this.manager.newMap.description= function(){ return $('#newmap-description') };
	this.manager.newMap.templateSelect= function(){ return $('#newmap-template') };
	this.manager.newMap.templateWorkspaceSelect= function(){ return $('#newmap-workspace-select') };
	this.manager.newMap.templateWorkspacePassword= function(){ return $('#newmap-workspace-password') };
    this.manager.git = {};
	this.manager.git.cloneLogs= function(){ return $('#git-clone-logs') };
	this.manager.git.commitLogs= function(){ return $('#git-logs') };
	this.manager.git.pullLogs= function(){ return $('#git-pull-logs') };
	this.manager.git.configureLogs= function(){ return $('#configure-logs') };
	this.dataBrowser= function(){ return $('#data-tab') };
    this.poi = {};
	this.poi.select= function() { return $('#poi-select') };
	this.poi.actions= function() { return $('.poi-container') }
    
    this.updateTimeout = null; //For window resize event

    /*--------------------------------
      Tabs and buttons
    --------------------------------*/
    $('.main').height( $('body').height()-$('.navbar').height())
    $("#main-tabs").tabs({heightStyle: "fill"});
    this.logs.logs().resizable({
        handles: 'n',
        alsoResize: '#logs .tabcontent'
    }).bind('resize', function(){        
        $(this).css("max-height", $('.main').height() - 40 + 'px'); //Fix for issue #121
        ScribeUI.UI.editor.mapfilePre().refresh(); //Fix for issue #122
        
        //Timeout to not update every millisecond a user is resizing the map 
        if(this.updateTimeout != null) 
        {
            clearTimeout(this.updateTimeout);
        }
        this.updateTimeout = setTimeout(function() { ScribeUI.UI.resizeMapViewport(); }, 200);  //Fix for issue #87
        
    });

    $("#log-tabs").tabs({heightStyle: "fill"});
    $('#log-tabs .tabheader').append(
        $('#logs-close-button').button({ 
            text: false,
            title: 'Close',
            icons: {
                primary: "ui-icon-close"
            }
        }).click(function(e){
            $('#logs').hide();
            ScribeUI.UI.resizeMapViewport();
        })
    );

    // Fix for ticket #40 https://github.com/mapgears/scribeui/issues/40
    $('#logs').css('top', $('#logs').position().top);
    
    $('#logs').hide();

    $('#editors-container').height($('#editor-tab').height() - this.editor.toolbar().outerHeight());
    $(window).on('resize', function () {
        $('.main').height( $('body').height()-$('.navbar').height())
        $('#main-tabs').tabs('refresh');
        $('#editors-container').height($('#editor-tab').height() - ScribeUI.UI.editor.toolbar().outerHeight());
        ScribeUI.UI.resizeEditors();
    });

    $("button").button({
        text: true
    });

    $(".map-button").button('disable');
    $("#editor-toolbar button").button('disable');

    $("a[href = '#manager-tab'], a[href = '#help-tab']").bind('click', function(){
        $("div[class='CodeMirror']").hide();
    }); 
    
    
    $("a[href='#mapfile-tab']").bind('click', function(){
        if(ScribeUI.workspace != null) {
            if(ScribeUI.workspace.openedMap){
                //Fixes an issue where lines below 101 are invisible
                ScribeUI.UI.editor.mapfilePre().refresh();
            }
        }
    });

    $("a[href='#editor-tab']").bind('mouseup', function(){
        $("div[class='CodeMirror']").show();
        ScribeUI.editorManager.get('groups').CMEditor.focus();
        $.each(ScribeUI.editorManager.editors, function(key, editor){
            //Need to use a timeout for the editors to refresh properly.
            // See http://stackoverflow.com/questions/10575833/codemirror-has-content-but-wont-display-until-keypress
            editor.CMEditor.refresh()
        });
		$('#editor-tab').show();
        $('#editors-container').height($('#editor-tab').height() - ScribeUI.UI.editor.toolbar().outerHeight());
        ScribeUI.UI.resizeEditors();
    });

    $('#btn_new_map').button().click(function(){
        ScribeUI.UI.openNewMapDialog();
    });

    $('#btn_open_map').button().click(function(){
        ScribeUI.Map.openMap();
    });

    $('#btn_export_map').button().click(function(){
        ScribeUI.Map.exportMap();
    });

    $('#link_export_map_info').click(function(){
        ScribeUI.UI.openMapExportInfoDialog();
    });

    $('#btn_delete_map').button().click(function(){
        ScribeUI.Map.deleteMap();
    });

    $('#btn_configure_map').button().click(function(){
        ScribeUI.configureMap();
    });

    $('#btn_clone_map').button().click(function(){
        ScribeUI.cloneMap();
    });

    $('#btn_commit_map').button().click(function(){
        ScribeUI.commitMap();
    });

    $('#btn_pull_map').button().click(function(){
        ScribeUI.pullMap();
    });

    this.manager.newMap.typeSelect().bind('change', function(){
        var templateWorkspace, password;
        if($("#newmap-ws").hasClass('invisible')){
            templateWorkspace = 'default';
            password = null;
        } else{
            templateWorkspace = this.manager.newMap.templateWorkspaceSelect().val();
            password = this.manager.newMap.templateWorkspacePassword().val();
        }

        ScribeUI.getTemplates(templateWorkspace, $(this).val(), password, function(templates){
            ScribeUI.UI.displayTemplates(templates);
        });
    });

    $('#btn_commit').button({
        icons: { primary: 'ui-icon-disk' }
    }).click( function(){
        ScribeUI.workspace.openedMap.save();
    });

    $('#btn_new_group').button({
        text: false,
        icons: { primary: 'ui-icon-plus' }
    }).click(function(e){
        createNewGroup();
    });

    $('#btn_change_group_order').button({
        text:false,
        icons: { primary: 'ui-icon-wrench' }    
    }).click(function(){
        ScribeUI.UI.openGroupOrderDialog();
    });
    $('#btn-open-logs').button({
        icons: { primary: 'ui-icon-flag' }    
    }).click(function(){
        $('#logs').toggle();
        $('#log-notification').hide();  
        ScribeUI.UI.resizeMapViewport();
    });
    $('#link-open-logs').click( function(){
        $('#logs').show();
    });
    $('#btn-zoom-poi').button().click( function(){
        ScribeUI.POI.zoomToPOI();
    });

    $('#btn-add-poi').button({
        text: false,
        icons: { primary: 'ui-icon-plus' }
    }).click( function(){
        ScribeUI.POI.addPOI();
    });
	$('#btn-remove-poi').button({
        text: false,
        icons: { primary: 'ui-icon-minus' }
    }).click( function(){
        ScribeUI.POI.removePOI();
    });

    $("a[href='#editor-tab']").bind('click', function(){
        $("div[class='CodeMirror']").show();
        $.each(ScribeUI.editorManager.editors, function(key, editor){
            editor.CMEditor.refresh();
        });
    });
    $(".secondary-wrap").resizable({
        handles: 's',
        resize: ScribeUI.UI.resizeEditors
    });
    $('.secondary-wrap').hide();
    
    $("a[href = '#data-tab']").bind('click', function(){
        ScribeUI.UI.displayDataBrowser();
    });


    $('select').chosen();
    
    //Shortcut for commit
    $("body").keypress(function(e){
        if (!(e.which == 115 && e.ctrlKey) && !(e.which == 19)) return true;
            ScribeUI.workspace.openedMap.save();
            e.preventDefault();
            return false;
    });
    //Warn the user if leaving before saving
    window.onbeforeunload = function(e){
        if(ScribeUI.workspace.openedMap && ScribeUI.workspace.openedMap.saved == false)
            return 'All unsaved changes will be lost, do you want to continue ?';    
    }

    getFeatureInfoDialog = $("#get-feature-info").dialog({
        autoOpen: false,
        resizable: true,
        width: 'auto',
        modal: true
    });

    $("#workspace")
        .button({
            icons: {
                secondary: "ui-icon-triangle-1-s"
            }
        })
        .click(function() {
            var menu = $( this ).parent().next().show().position({
                my: "left top",
                at: "left bottom",
                of: this
            });
            $( document ).one( "click", function() {
                menu.hide();
            });
            return false;
        })
        .parent()
            .next()
                .hide()
                .menu();

}

ScribeUI.UI.displayWorkspaces = function(select){
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
ScribeUI.UI.displayTemplates = function(templates){
    this.manager.newMap.templateSelect().empty();

    $.each(templates, function(index, template){
        var option = $('<option>').val(template.name).text(template.name);
        ScribeUI.UI.manager.newMap.templateSelect().append(option);
    });
    this.manager.newMap.templateSelect().trigger('chosen:updated');    
}

ScribeUI.UI.openNewMapDialog = function(){
    var type = this.manager.newMap.typeSelect().val();
    ScribeUI.getTemplates('default', type, null, function(templates){
        ScribeUI.UI.displayTemplates(templates);

        $("#createmap-form").dialog({
            autoOpen: false,
            resizable: false,
            modal: true,
            width: 'auto',
            buttons: {
                "Create": function() {
                    var name = ScribeUI.UI.manager.newMap.name().val();
                    var type = ScribeUI.UI.manager.newMap.typeSelect().val();
                    var template = ScribeUI.UI.manager.newMap.templateSelect().val();
                    var templateWorkspace = ScribeUI.UI.manager.newMap.templateWorkspaceSelect().val();
                    var templateWorkspacePassword = ScribeUI.UI.manager.newMap.templateWorkspacePassword().val();
                    var description = $("<div>").text(ScribeUI.UI.manager.newMap.description().val()).html(); //Escape characters
                    
                    var errors = "";
                    var alphaNumericRegex = new RegExp("^[a-zA-Z0-9_]*$")
                    if(name.length == 0) errors += "The 'Name' field is mandatory \n"
                    else if (!alphaNumericRegex.test(name)) errors += "The 'Name' field must contain only alphanumeric characters (A-z, 0-9, _)\n"
                    else if (ScribeUI.workspace.getMapByName(name)) errors += "There is already a map with that name\n"
                    
                    if(errors.length == 0)
                    {
                        var mapData = {
                            name: name,
                            type: type,
                            description: description,
                            template: template,
                            template_workspace: templateWorkspace ? templateWorkspace : 'default',
                            template_workspace_password: templateWorkspacePassword ? templateWorkspacePassword : ''
                        }

                        ScribeUI.workspace.createMap(mapData);

                        $(this).dialog("close");
                    }
                    else alert(errors);
                },
                "+": function(){
                    ScribeUI.Workspace.getWorkspaces(function(workspaces){
                        $("#newmap-ws").removeClass('invisible');

                        ScribeUI.UI.manager.newMap.templateWorkspaceSelect().empty();
                        ScribeUI.UI.manager.newMap.templateWorkspaceSelect().unbind('change');

                        $.each(workspaces, function(index, workspace){
                            var option = $('<option>').val(workspace.name).text(workspace.name);
                            ScribeUI.UI.manager.newMap.templateWorkspaceSelect().append(option);
                        });
                        ScribeUI.UI.manager.newMap.templateWorkspaceSelect().trigger('chosen:updated');

                        ScribeUI.UI.manager.newMap.templateWorkspaceSelect().bind('change', function(){
                            var templateWorkspace = $(this).val();
                            var password = ScribeUI.UI.manager.newMap.templateWorkspacePassword().val();
                            var type = ScribeUI.UI.manager.newMap.typeSelect().val()

                            ScribeUI.getTemplates(templateWorkspace, type, null, function(templates){
                                ScribeUI.UI.displayTemplates(templates);
                            }); 
                        });
                    });         
                },
                Cancel: function() {
                    $(this).dialog("close");
                }
            },
            close: function() {
                ScribeUI.UI.manager.newMap.templateSelect().empty();
                ScribeUI.UI.manager.newMap.templateWorkspaceSelect().empty();
                $("#newmap-ws").addClass("invisible");
                $('input').val('');
                $('textarea').val('');
            }
        }).dialog("open");

    });
}

ScribeUI.UI.openMapExportInfoDialog = function(){
    $("#exportmap-info").dialog({
        autoOpen: false,
        resizable: false,
        modal: true,
        width: '350px',
        buttons: {
            Close: function() {
                $(this).dialog("close");
            }
        }
    }).dialog("open");
}

ScribeUI.UI.displayConfiguration = function(config){
    $("#git-url").val(config.gitURL);
    $("#git-user").val(config.gitUser);
    $("#git-password").val(config.gitPassword);
    $("#configure-url").val(config.url);
    $("#configure-description").val(config.description);
}

ScribeUI.UI.openNewGroupDialog= function(){
    $("#creategroup-form").dialog({
        autoOpen: false,
        resizable: false,
        modal: true,
        width: 'auto',
        buttons: {
            "Create": function() {
                var name = $("#newgroup-name").val();
                var group = ScribeUI.workspace.openedMap.getGroupByName(name);
                //TODO: VALIDER AUSSI LE FORMAT DU GROUPE ET LA PRÉSENCE DE CARACTÈRES SPÉCIAUX
                if(group){
                    alert('A group with that name exists already');
                } else{
                    ScribeUI.workspace.openedMap.groups.push({name: name, content: ''});
                    ScribeUI.workspace.openedMap.newGroups.push(name);

                    ScribeUI.UI.editor.groupSelect().append($('<option></option>').attr('value', name).text(name));
                    ScribeUI.UI.editor.groupSelect().trigger('chosen:updated');

                    ScribeUI.workspace.openedMap.displayGroupsList();

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

ScribeUI.UI.openGroupOrderDialog = function(){
    ScribeUI.workspace.openedMap.displayGroupsList();
    ScribeUI.workspace.openedMap.removedGroups = [];
    ScribeUI.workspace.openedMap.newGroups = [];
    ScribeUI.workspace.openedMap.updatedGroups = [];

    $("#grouporder-form").dialog({
        autoOpen: false,
        resizable: false,
        modal: true,
        width: 'auto',
        buttons: [
        {
            text: "+", //ADD
            showText: false,
            'class': 'btn-group-first',
            icons: { primary: 'ui-icon-plus'},
            click: function(){
                var group = ScribeUI.UI.editor.groupsList().find('.ui-selected');
                ScribeUI.UI.openNewGroupDialog();
            }
        },
        {
            text: "Delete", //DELETE
            showText: false,
            'class': 'btn-group-last',
            icons: { primary: 'ui-icon-trash'},
            click: function(){
                var group = ScribeUI.UI.editor.groupsList().find('.ui-selected');
                //workspace.openedMap.removedGroups.push(group.text());
                group.addClass('to-be-deleted');
            }
        },
        {
            text: '+', //DOWN
            showText: false,
            'class': 'btn-group-first',
            icons: { primary: 'ui-icon-carat-1-s'},
            click: function(){
                var group = ScribeUI.UI.editor.groupsList().find('.ui-selected');
                var bumped = group.next();

                if(group.length > 0 && group.length == bumped.length){
                    $(group.get().reverse()).each(function(i){
                        ScribeUI.workspace.openedMap.lowerGroupIndex($(this).text());
                        $(this).insertAfter($(this).next());
                    });
                }
            }
        },
        {
            text: '-', //UP
            showText: false,
            'class': 'btn-group-last',
            icons: { primary: 'ui-icon-carat-1-n'},
            click: function(){
                var group = ScribeUI.UI.editor.groupsList().find('.ui-selected');
                var bumped = group.prev();

                if(group.length > 0 && group.length == bumped.length){
                    group.each(function(i){
                        ScribeUI.workspace.openedMap.raiseGroupIndex($(this).text());
                        $(this).insertBefore($(this).prev());
                    });

                }
            }
        },
        {
            text: "Apply",//APPLY
            showText: true,
            'class': 'btn-group-first grouporder-btn-right',
            click:  function() {
                $(".to-be-deleted").each(function(){
                    ScribeUI.workspace.openedMap.removedGroups.push($(this).text());
                });

                $("#grouporder-form li:not(.to-be-deleted)").each(function(){
                    ScribeUI.workspace.openedMap.updatedGroups.push($(this).text());    
                })
                
                $(this).dialog("close");

                ScribeUI.workspace.openedMap.setGroups();

            }
        },
        {
            text: "Cancel",//CANCEL
            showText: true,
            'class': 'btn-group-last grouporder-btn-right',
            click: function() {
                $.each(ScribeUI.workspace.openedMap.newGroups, function(index, name){
                    ScribeUI.workspace.openedMap.removeGroup(name);
                });
                ScribeUI.workspace.openedMap.setGroups();

                $(this).dialog("close");
            }
        }],
        close: function() {}
    });

    $('.grouporder-btn-right').wrapAll('<div class="grouporder-btnset-right"></div>');

    $("#grouporder-form").dialog("open");
}

ScribeUI.UI.displayDataBrowser = function(){
    if(ScribeUI.workspace){
        if(ScribeUI.workspace.openedMap){
            ScribeUI.workspace.openedMap.openDataBrowser();
        }
    }
}

ScribeUI.UI.resizeEditors = function(){
    if( $('.secondary-wrap').is(':visible'))
        var remainingSpace = $('#editors-container').height() - $('.secondary-wrap').outerHeight();
    else var remainingSpace = $('#editors-container').height();
    var divTwo = $('.main-editor');
    var divTwoHeight = remainingSpace - (divTwo.outerHeight() - divTwo.height());
    divTwo.css('height', divTwoHeight + 'px');    
    $('#editors-container').height($('#editor-tab').height() - ScribeUI.UI.editor.toolbar().outerHeight());
}

ScribeUI.UI.resizeMapViewport = function(){
    if($('#logs').is(':visible')){
        $('#map').css("bottom", 30 + $('#logs').height() + "px");  
    }
    else {
        $('#map').css("bottom", 30 + "px");  
    }            
    ScribeUI.workspace.openedMap.OLMap.updateSize();
    
    //This ugly fix refreshes the viewport size, fixes a bug where the viewport doesn't take its place back after resizing the logs
    ScribeUI.workspace.openedMap.OLMap.viewPortDiv.style.height='99%'
    setTimeout(function() { ScribeUI.workspace.openedMap.OLMap.viewPortDiv.style.height='100%'; }, 30); 
}

ScribeUI.UI.openSecondaryPanel = function(editor){
    $('#secondary-editor > .tabcontent-small').hide();
    $('.secondary-wrap').hide();
    if(editor.name != 'Groups'){
        $('.secondary-wrap').show();
        $('#' + editor.id + "-tab").show();
            //Dirty workaround but it's the only way I found so far
            //to make the secondary editor display all it's content properly
            //Both refresh are needed...
            editor.CMEditor.refresh();
            //setTimeout(editor.CMEditor.refresh, 1);
    }else{
         $('.secondary-wrap').hide();
    }
    $('#editor_select_chosen').find('span').text(editor.name);
    ScribeUI.UI.resizeEditors();
}

ScribeUI.UI.scribeLog = function(msg){
    if(msg.indexOf("**ERRORS**") != -1){
        if(!$('#logs').is(':visible'))
            $('#log-notification').show('pulsate', 1000);                
    }else{
        $('#log-notification').hide();                
    }
    $("#" + self.workspace.logTextarea).val(msg);
}

ScribeUI.UI.displayDebug = function(){
    if($('.olTileImage').filter(function(){ return this.style && this.style.visibility === 'hidden' }).length > 0){
        ScribeUI.Map.onMapMoveEnd();
    }else{
       ScribeUI.workspace.openedMap.getDebug();
    }
}

ScribeUI.UI.displayResultLine = function(line){
    var tabIndex = $('#tabs a[href="#mapfile-tab"]').parent().index();
    this.logs.tabs().tabs({active: tabIndex});
    ScribeUI.UI.editor.mapfilePre().refresh();
    //Scroll to taken from http://codemirror.977696.n3.nabble.com/Scroll-to-line-td4028275.html
    var h = ScribeUI.UI.editor.mapfilePre().getScrollInfo().clientHeight;
    var coords = ScribeUI.UI.editor.mapfilePre().charCoords({line: line, ch: 0}, "local");
    ScribeUI.UI.editor.mapfilePre().scrollTo(null, (coords.top + coords.bottom - h) / 2);
    
}

/* This function switches to the right layer and group
loc contains:
    loc.editor, the editor,
    loc.group if loc.editor == 'groups'
    loc.lineNumber, the line number */
ScribeUI.UI.switchToLayer = function(loc){
    //Switch to the editor tab
    var tabIndex = $('[href="#editor-tab"]').parent().index();
    $('#main-tabs').tabs({active: tabIndex});

    //ScribeUI.UI.editor.editorSelect().val(loc.editor).trigger('change');
    this.openSecondaryPanel(loc.editor);

    if(loc.editor.name == "Groups"){
        ScribeUI.UI.editor.groupSelect().val(loc.group).trigger('change');
        ScribeUI.UI.editor.groupSelect().trigger('chosen:updated');
    }

    loc.editor.CMEditor.refresh();
}

ScribeUI.UI.displayLineEditor = function(cm, line, text){
    $('#edit-line-content').val(text);

    $("#edit-line").dialog({
        autoOpen: false,
        resizable: false,
        modal: true,
        width: 'auto',
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
ScribeUI.UI.addTab = function(name, destinationSelector, options){
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

ScribeUI.UI.addComponent = function(component, destinationSelector, options){
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
ScribeUI.UI.addButton = function(name, destinationSelector, options){
    options = (options) ? options : {};
    var onclick = options.onclick || null;
    var position = options.position || 'last';
    var buttonid = options.buttonid || name;
    if($(destinationSelector).exists()){
        button = $('<button id="'+buttonid+'">'+name+'</button>').button();
        button.click(onclick);
        return this.addComponent(button, destinationSelector, options)
    }else return null;
}
