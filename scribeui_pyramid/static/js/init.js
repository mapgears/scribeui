var selectors, workspace, editors, plugins;

jQuery(function() { 
    selectors = {
        mapDescription: function(){ return $('#map-description') },
        mapActions: function(){ return $('#map-actions') },
        mapsList: function(){ return $('#maps-list') },
        editorToolbar: function(){ return $('#editor-toolbar') },
        groupSelect: function(){ return $('#group-select') },
        editorSelect: function(){ return $('#editor-select') },
        groupsList: function(){ return $('#groups-ol') },
        logs: function(){ return $('#logs') },
        logsPre: function(){ return $('#txt-logs') },
        logsNotification: function(){ return $('#log-notification') },
        mapfilePre: function(){ return $('#txt-result') },
        debugPre: function(){ return $('#txt-debug') },
        newMapName: function(){ return $('#newmap-name') },
        newMapTypeSelect: function(){ return $('#newmap-type') },
        newMapDescription: function(){ return $('#newmap-description') },
        templateSelect: function(){ return $('#newmap-template') },
        templateWorkspaceSelect: function(){ return $('#newmap-workspace-select') },
        templateWorkspacePassword: function(){ return $('#newmap-workspace-password') },
        gitCloneLogs: function(){ return $('#git-clone-logs') },
        gitCommitLogs: function(){ return $('#git-logs') },
        gitPullLogs: function(){ return $('#git-pull-logs') },
        dataBrowser: function(){ return $('#data-tab') },
        poiSelect: function() { return $('#poi-select') },
        poiActions: function() { return $('.poi-container') }
    }

    workspace = new Workspace($WSNAME);
    workspace.open();

    workspaceConfig = {
        "workspaceSelect": "workspace-select",
        "workspaceManage": "workspace-manage",
        "workspacePassword": "workspace-password",
        "mapDiv": "map",
        "mapActions": "map-actions",
        "mapList": "map-list",
        "mapDescription": "map-description",
        "poiSelect": "poi-select",
        "groupSelect": "group-select",
        "groupOl": "group-ol",
        "dataDiv": "data-tab",
        "logTextarea": "txt-logs",
        "resultTextarea": "txt-result",
        "debugTextarea": "txt-debug",
    }

    mapTypes = ["Scribe",  "Standard"];
    
    plugins = [];
    
    //openWorkspacePopup(workspaceConfig); 

    
    /*--------------------------------
      Init code editors
    --------------------------------*/
    var options = {
        lineNumbers: true,
        mode: "scribe",
        indentUnit: 4,
        autofocus: true,
        tabMode: "spaces",
        matchBrackets: true,
        lineWrapping: true,
        onChange: function(){
            workspace.openedMap.saved = false;
        },
        onGutterClick: function(cm, line, gutter, e){
            var text = cm.getLine(line);
            displayLineEditor(cm, line, text);
        }
    }

    var readmeOptions = {
        lineNumbers: true,
        mode: "markdown",
        indentUnit: 4,
        autofocus: true,
        tabMode: "spaces",
        matchBrackets: true,
        lineWrapping: true,
        onChange: function(){
            workspace.openedMap.saved = false;
        },
        onGutterClick: function(cm, line, gutter, e){
            var text = cm.getLine(line);
            displayLineEditor(cm, line, text);
        }
    }

    editors = {
        groups: CodeMirror.fromTextArea(document.getElementById("editor"), options),
        maps: CodeMirror.fromTextArea(document.getElementById("map-editor"), options),
        variables: CodeMirror.fromTextArea(document.getElementById("variable-editor"), options),
        scales: CodeMirror.fromTextArea(document.getElementById("scale-editor"), options),
        symbols: CodeMirror.fromTextArea(document.getElementById("symbol-editor"), options),
        fonts: CodeMirror.fromTextArea(document.getElementById("font-editor"), options),
        projections: CodeMirror.fromTextArea(document.getElementById("projection-editor"), options),
        readmes: CodeMirror.fromTextArea(document.getElementById("readme-editor"), readmeOptions)
    }
    
    /*--------------------------------
      Tabs and buttons
    --------------------------------*/

    $('.main').height( $('body').height()-$('.navbar').height())
    $("#main-tabs").tabs({heightStyle: "fill"});
    $("#logs").resizable({
        handles: 'n',
        alsoResize: '#logs .tabcontent'
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
        })
    );
    // Fix for ticket #40 https://github.com/mapgears/scribeui/issues/40
    $('#logs').css('top', $('#logs').position().top);
    
    $('#logs').hide();

    $('#editors-container').height($('#editor-tab').height() - 40);
    $(window).on('resize', function () {
        $('.main').height( $('body').height()-$('.navbar').height())
        $('#main-tabs').tabs('refresh');
        $('#editors-container').height($('#editor-tab').height() - 40);
        resizeEditors();
    });

    $("button").button({
        text: true
    });

    $(".map-button").button('disable');
    $("#editor-toolbar button").button('disable');

    $("a[href = '#manager-tab'], a[href = '#help-tab']").bind('click', function(){
        $("div[class='CodeMirror']").hide();
    }); 

    $("a[href = '#manager-tab'], a[href = '#log-tab'], a[href = '#editor-tab'], a[href = '#mapfile-tab'], a[href = '#help-tab']").bind('click', function(){
         if(workspace) {
             if(workspace.openedMap){
                unregisterDebug();
             }
         }
    });

    $("a[href = '#debug-tab']").bind('click', function(){
        if(workspace != null) {
            if(workspace.openedMap){
                clearDebug();
                registerDebug();
            }
        }
    });

    $("a[href = '#editor-tab']").bind('click', function(){
        $("div[class='CodeMirror']").show();
        $.each(editors, function(key, editor){
            editor.refresh();
        });
    });

    $('#btn_new_map').button().click(function(){
        openNewMapDialog();
    });

    $('#btn_open_map').button().click(function(){
        openMap();
    });

    $('#btn_export_map').button().click(function(){
        exportMap();
    });

    $('#btn_delete_map').button().click(function(){
        deleteMap();
    });

    $('#btn_configure_map').button().click(function(){
        configureMap();
    });

    $('#btn_clone_map').button().click(function(){
        cloneMap();
    });

    $('#btn_commit_map').button().click(function(){
        commitMap();
    });

    $('#btn_pull_map').button().click(function(){
        pullMap();
    });

    selectors.newMapTypeSelect().bind('change', function(){
        if($("#newmap-ws").hasClass('invisible')){
            var templateWorkspace = 'default';
            var password = null;
        } else{
            var templateWorkspace = selectors.templateWorkspaceSelect().val();
            var password = selectors.templateWorkspacePassword().val();
        }

        getTemplates(templateWorkspace, $(this).val(), password, function(templates){
            displayTemplates(templates);
        });
    });
/*
    $("#newmap-type").bind('change', function(){
        displayTemplates('templates', $("#newmap-type").val());
        displayTemplates($("#newmap-workspace-select").val(), $("#newmap-type").val());  
    });
*/
    $('#btn_commit').button({
        icons: { primary: 'ui-icon-disk' }
    }).click( function(){
        workspace.openedMap.save();
    });

    $('#btn_new_group').button({
        text: false,
        icons: { primary: 'ui-icon-plus' }
    }).click(function(e){
           createNewGroup();
    });
    $('#btn_delete_group').button({
        text: false,
        icons: { primary: 'ui-icon-minus' }
    }).click(function(e){
           deleteGroup({mapType: _workspace.openedMap.type});
    });

    $('#btn_change_group_order').button({
        text:false,
        icons: { primary: 'ui-icon-wrench' }    
    }).click(function(){
        openGroupOrderDialog();
    });
    $('#btn-open-logs').button({
        /*text:false,*/
        icons: { primary: 'ui-icon-flag' }    
    }).click(function(){
        $('#logs').toggle();
        $('#log-notification').hide();                
    });
    $('#btn-zoom-poi').button().click( function(){
        zoomToPOI();
    });

    $('#btn-add-poi').button({
        text: false,
        icons: { primary: 'ui-icon-plus' }
    }).click( function(){
        addPOI();
    });
    $("a[href='#editor-tab']").bind('click', function(){
        $("div[class='CodeMirror']").show();
        $.each(editors, function(key, editor){
            editor.refresh();
        });
    });
    $(".secondary-wrap").resizable({
        handles: 's',
        resize: resizeEditors
    });
    $('.secondary-wrap').hide();
    
    $("a[href = '#data-tab']").bind('click', function(){
        displayDataBrowser();
    });

    var newMapTypeSelect = $("#newmap-type");
    var cloneMapTypeSelect = $("#git-clone-type");
    for(var i = 0; i < mapTypes.length; i++){
        newMapTypeSelect.append($("<option></option>").attr("value", mapTypes[i]).text(mapTypes[i]));
        cloneMapTypeSelect.append($("<option></option>").attr("value", mapTypes[i]).text(mapTypes[i]));
    }

    $('select').chosen();
    
    //Shortcut for commit
    $("body").keypress(function(e){
        if (!(e.which == 115 && e.ctrlKey) && !(e.which == 19)) return true;
            workspace.openedMap.save();
            e.preventDefault();
            return false;
    });
    //Warn the user if leaving before saving
    window.onbeforeunload = function(e){
        if(_workspace.openedMap.saved == false)
            return 'All unsaved changes will be lost, do you want to continue ?';    
    }

    $.event.special.tripleclick = {

        setup: function(data, namespaces) {
            var elem = this, $elem = jQuery(elem);
            $elem.bind('click', jQuery.event.special.tripleclick.handler);
        },

        teardown: function(namespaces) {
            var elem = this, $elem = jQuery(elem);
            $elem.unbind('click', jQuery.event.special.tripleclick.handler)
        },

        handler: function(event) {
            var elem = this, $elem = jQuery(elem), clicks = $elem.data('clicks') || 0;
            clicks += 1;
            if ( clicks === 3 ) {
                clicks = 0;

                // set event type to "tripleclick"
                event.type = "tripleclick";
                
                // let jQuery handle the triggering of "tripleclick" event handlers
                jQuery.event.handle.apply(this, arguments)  
            }
            $elem.data('clicks', clicks);
        }
        
    };

    getFeatureInfoDialog = $("#get-feature-info").dialog({
        autoOpen: false,
        resizable: true,
        modal: true
    });
});

