jQuery(function() {     
    _workspace = null;
    workspaceConfig = {
        "workspaceSelect": "workspace-select",
        "workspacePassword": "workspace-password",
        "mapDiv": "map",
        "mapTable": "map-table",
        "mapDescription": "map-description",
        "poiSelect": "poi-select",
        "groupSelect": "group-select",
        "groupTable": "group-table",
        "dataDiv": "data-tab",
        "logTextarea": "txt-logs",
        "resultTextarea": "txt-result",
        "debugTextarea": "txt-debug",
        "scaleLevelDiv": "scale-level"
    }

    mapTypes = ["Scribe", "Basemaps", "Standard"];

    displayWorkspaces(workspaceConfig.workspaceSelect);
   
    /*--------------------------------
      Init code editors
    --------------------------------*/
    var options = {
        lineNumbers: true,
        mode: {
            name: "python",
            version: 2,
            singleLineStringErrors: false
        },
        indentUnit: 4,
        autofocus: true,
        tabMode: "spaces",
        matchBrackets: true
    }

    groupEditor = CodeMirror.fromTextArea(document.getElementById("editor"), options);
    mapEditor = CodeMirror.fromTextArea(document.getElementById("map-editor"), options);
    variableEditor = CodeMirror.fromTextArea(document.getElementById("variable-editor"), options);
    scaleEditor = CodeMirror.fromTextArea(document.getElementById("scale-editor"), options);
    symbolEditor = CodeMirror.fromTextArea(document.getElementById("symbol-editor"), options);
    fontEditor = CodeMirror.fromTextArea(document.getElementById("font-editor"), options);
    projectionEditor = CodeMirror.fromTextArea(document.getElementById("projection-editor"), options);

    /*--------------------------------
      Tabs and buttons
    --------------------------------*/
    $("#tab1").tabs();
    $("#tab2").tabs();

    $("button").button({
	text: true
    });

    $(".map-button").button('disable');
    $(".group-button").button('disable');

    $("a[href = '#manager-tab'], a[href = '#log-tab'], a[href = '#debug-tab'], a[href = '#mapfile-tab'], a[href = '#help-tab']").bind('click', function(){
        $("div[class='CodeMirror']").hide();
    }); 

    $("a[href = '#manager-tab'], a[href = '#log-tab'], a[href = '#editor-tab'], a[href = '#mapfile-tab'], a[href = '#help-tab']").bind('click', function(){
         if(_workspace != null) {
             if(_workspace.openedMap){
                 unregisterDebug();
             }
         }
    });

    $("a[href = '#debug-tab']").bind('click', function(){
        if(_workspace != null) {
            if(_workspace.openedMap){
                clearDebug();
                registerDebug();
            }
        }
    });

    $("a[href = '#editor-tab']").bind('click', function(){
        $("div[class='CodeMirror']").show();
        groupEditor.refresh();
	    variableEditor.refresh();
    });

    $('#btn_new_ws').bind('click', function(){
	    openNewWorkspaceWindow(workspaceConfig);
    });

    $('#btn_open_ws').bind('click', function(){
	    openWorkspace(workspaceConfig);
    });

    $('#btn_delete_ws').bind('click', function(){
	    deleteWorkspace(workspaceConfig);
    });

    $('#btn_new_map').bind('click', function(){
	    openNewMapWindow();
    });

    $('#btn_open_map').bind('click', function(){
	    openMap();
    });

    $('#btn_export_map').bind('click', function(){
	    exportMap();
    });

    $('#btn_delete_map').bind('click', function(){
	    deleteMap();
    });

    $('#btn_commit').bind('click', function(){
	    _workspace.openedMap.commit();
    });

    $('#btn_new_group').bind('click', function(){
	    createNewGroup();
    });

    $('#btn_delete_group').bind('click', function(){
	    deleteGroup();
    });

    $('#btn_change_group_order').bind('click', function(){
	    openGroupOrderWindow();
    });

    $('#btn-zoom-poi').bind('click', function(){
	    zoomToPOI();
    });

    $('#btn-add-poi').bind('click', function(){
        addPOI();
    });

    $("a[href = '#editor-tab']").bind('click', function(){
        mapEditor.refresh();
	    variableEditor.refresh();
	    scaleEditor.refresh();
	    symbolEditor.refresh();
	    fontEditor.refresh();
	    projectionEditor.refresh();
    });

    $("a[href = '#map-tab']").bind('click', function(){
        mapEditor.refresh();
    });

    $("a[href = '#variable-tab']").bind('click', function(){
        variableEditor.refresh();
    });

    $("a[href = '#scale-tab']").bind('click', function(){
        scaleEditor.refresh();
    });

    $("a[href = '#symbol-tab']").bind('click', function(){
        symbolEditor.refresh();
    });

    $("a[href = '#font-tab']").bind('click', function(){
        fontEditor.refresh();
    });

    $("a[href = '#projection-tab']").bind('click', function(){
        projectionEditor.refresh();
    });

    $("a[href = '#data-tab']").bind('click', function(){
        displayDataBrowser();
    });

    var typeSelect = $("#newmap-type");
    for(var i = 0; i < mapTypes.length; i++){
        typeSelect.append($("<option></option>").attr("value", mapTypes[i]).text(mapTypes[i]));
    }

    $(".tabheader-editor-container").resizable({ 
        alsoResize: ".tabfooter-editor-container",
        handles: "n, s",
        start: function(event, ui){
            lower = $(".tabfooter-editor-container");
            lowerHeight = lower.height();

            lowerEditor = $(".editor-container");
            lowerEditorHeight = lowerEditor.height();

            lastHeight = ui.originalSize.height;   
        },
        resize: function(event, ui){           
            lower.height(lowerHeight - (ui.size.height - lastHeight));
            lowerEditor.height(lowerEditorHeight - (ui.size.height - lastHeight));
            lastHeight = ui.size.height;    
        },
        stop: function(event, ui){
            lower.height(lowerHeight - (ui.size.height - ui.originalSize.height));
            lowerEditor.height(lowerEditorHeight - (ui.size.height - ui.originalSize.height));

            lower.css("width", "100%");           
            $(".tabheader-editor-container").css("width", "100%");

            mapEditor.refresh();
            groupEditor.refresh();        
        } 
    });
});
