jQuery(function() {     
    _workspace = null;
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
        "scaleLevelDiv": "scale-level",
	"popupHeight":400,
	"popupWidth":400
    }

    mapTypes = ["Scribe", "Basemaps", "Standard"];

    openWorkspacePopup(workspaceConfig); 
	
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
    $("#tab1").tabs({heightStyle: "fill"});
	$('.main').on('resize', function () {
        $('#tab1').tabs('refresh');
    });
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

    $('#btn_new_map').button().click(function(){
	    openNewMapWindow();
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

    $("#newmap-type").bind('blur', function(){
	    displayTemplates('templates', $("#newmap-type").val());
	    displayTemplates($("#newmap-workspace-select").val(), $("#newmap-type").val());    
    });

    $('#btn_commit').button().click( function(){
	    _workspace.openedMap.commit();
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
	    openGroupOrderWindow();
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

    $("a[href = '#editor-tab']").bind('click', function(){
        mapEditor.refresh();
	    variableEditor.refresh();
	    scaleEditor.refresh();
	    symbolEditor.refresh();
	    fontEditor.refresh();
	    projectionEditor.refresh();
    });
	$("#secondary-editor").resizable({
		handles: 's',
		resize: function(e){
			var remainingSpace = $(this).parent().height() - $(this).outerHeight();
      		var divTwo = $('.main-editor');
      		var divTwoHeight = remainingSpace - (divTwo.outerHeight() - divTwo.height());
      		divTwo.css('height', divTwoHeight + 'px');	
		}
	});
	$('#secondary-editor').hide();
	$('#group-edition-select').change(function(e){
		$('#secondary-editor > .tabcontent-small').hide();
		$('#secondary-editor').hide();
		switch(this.value){
			case 'map': 
				$('#secondary-editor').show();
				$('#map-tab').show();
       			mapEditor.refresh();
				break;
			case 'scales': 
				$('#secondary-editor').show();
				$('#scale-tab').show();
       			scaleEditor.refresh();
				break;
			case 'symbols': 
				$('#secondary-editor').show();
				$('#symbol-tab').show();
       			symbolEditor.refresh();
				break;
			case 'fonts': 
				$('#secondary-editor').show();
				$('#font-tab').show();
       			fontEditor.refresh();
				break;
			case 'projections': 
				$('#secondary-editor').show();
				$('#projection-tab').show();
       			projectionEditor.refresh();
				break;
			case 'x':
				return;
		}
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
