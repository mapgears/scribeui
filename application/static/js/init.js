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
	"popupHeight":400,
	"popupWidth":400
    }

    mapTypes = ["Scribe",  "Standard"];
	
	plugins = [];
	
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
        matchBrackets: true,
		onChange: function(e){
			_workspace.openedMap.saved = false;
		}
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

	$('#editors-container').height($('#editor-tab').height() - 27);
	$(window).on('resize', function () {
    	$('.main').height( $('body').height()-$('.navbar').height())
        $('#main-tabs').tabs('refresh');
		$('#editors-container').height($('#editor-tab').height() - 27);
		resizeEditors();
    });

    $("button").button({
		text: true
    });

    $(".map-button").button('disable');
    $(".group-button").button('disable');

    $("a[href = '#manager-tab'], a[href = '#help-tab']").bind('click', function(){
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
	    openGroupOrderWindow();
    });
	$('#btn-open-logs').button({
		text:false,
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

    $("a[href = '#editor-tab']").bind('click', function(){
        mapEditor.refresh();
	    variableEditor.refresh();
	    scaleEditor.refresh();
	    symbolEditor.refresh();
	    fontEditor.refresh();
	    projectionEditor.refresh();
    });
	$(".secondary-wrap").resizable({
		handles: 's',
		resize: resizeEditors
	});
	$('.secondary-wrap').hide();
	
    $("a[href = '#data-tab']").bind('click', function(){
        displayDataBrowser();
    });

    var typeSelect = $("#newmap-type");
    for(var i = 0; i < mapTypes.length; i++){
        typeSelect.append($("<option></option>").attr("value", mapTypes[i]).text(mapTypes[i]));
    }
	
	//Shortcut for commit
	$("body").keypress(function(e){
		if (!(e.which == 115 && e.ctrlKey) && !(e.which == 19)) return true;
			_workspace.openedMap.commit();
			e.preventDefault();
			return false;
	});
	//Warn the user if leaving before saving
	window.onbeforeunload = function(e){
		if(_workspace.openedMap.saved == false)
			return 'All unsaved changes will be lost, do you want to continue ?';	
	}
});

