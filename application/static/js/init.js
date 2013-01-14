jQuery(function() {
     MAPS = []; 
    CURRENT_WORKSPACE = null;
    MAP_EDITED = null;
    DEBUG = 0;

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

    displayWorkspaces(workspaceConfig.workspaceSelect);
   
    /*--------------------------------
      Init code editors
    --------------------------------*/
    var options = {
        lineNumbers: true,
        mode: {name: "python",
               version: 2,
               singleLineStringErrors: false},
        indentUnit: 4,
        autofocus: true,
        tabMode: "spaces",
        matchBrackets: true
    }
/*
    CodeMirror.xmlHints['<'] = [
        'levelTop',
        'levelRoot',
        'mainLevel'
    ];

    CodeMirror.xmlHints['<levelTop '] = 
        CodeMirror.xmlHints['<levelRoot '] = 
        CodeMirror.xmlHints['<mainLevel '] = [
            'property1111',
            'property2222'
        ];

    CodeMirror.xmlHints['<levelTop><'] = 
        CodeMirror.xmlHints['<levelRoot><'] = 
        CodeMirror.xmlHints['<mainLevel><'] = [
            'second',
            'two'
        ];

    CodeMirror.xmlHints['<levelTop><second '] = [
        'secondProperty'
    ];

    CodeMirror.xmlHints['<levelTop><second><'] = [
        'three',
        'x-three'
    ];

    options = {
        value: '',
        mode: 'text/html',
        lineNumbers: true,
        extraKeys: {
            "'>'": function(cm) { cm.closeTag(cm, '>'); },
            "'/'": function(cm) { cm.closeTag(cm, '/'); },
            "' '": function(cm) { CodeMirror.xmlHint(cm, ' '); },
            "'<'": function(cm) { CodeMirror.xmlHint(cm, '>'); },
            "Ctrl-Space": function(cm) { CodeMirror.xmlHint(cm, ''); }
        }
    }
*/    

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
         if(_workspace.openedMap){
             unregisterDebug();
         }
    });

    $("a[href = '#debug-tab']").bind('click', function(){
        if(_workspace.openedMap){
            clearDebug();
            registerDebug();
        }
    });

    $("a[href = '#editor-tab']").bind('click', function(){
        $("div[class='CodeMirror']").show();
        groupEditor.refresh();
	variableEditor.refresh();
    });

    $('#title').bind('click', function(){
	$.post($SCRIPT_ROOT + '/_current_info', {
    	}, function(result) {	
	    $('#info').text(result);
	});
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

    $('#btn_delete_map').bind('click', function(){
	deleteMap();
    });

    $('#btn_backup_map').bind('click', function(){
	backupMap();
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

/*
    $('#btn_new_ws').bind('click', function(){
	if(MAP_EDITED != null){
            $( "#save_dialog:ui-dialog" ).dialog( "destroy" );   
            $( "#save_dialog" ).dialog({
	        resizable: false,
	        height:140,
	        modal: true,
	        buttons: {
	            "Save": function() {
	                 $(this).dialog( "close" );
			 saveEdits(MAP_EDITED, false);
			 createws();
		     },
		     "No": function() {
		     	 $(this).dialog( "close" );
			 createws();
		     },
                     "Cancel": function() {
		     	 $(this).dialog( "close" );
		     }
	         }
	     });
	}else{
	    createws();
	}
    getInfo();
    });

    $('#btn_upload_data').bind('click', function(){
	$('#uploadName').attr("value", "");
	$('#uploadData').attr("value", "");
	$('#typeData').attr("checked","checked");
        $( "#upload_data:ui-dialog" ).dialog( "destroy" );
        $( "#upload_data" ).dialog({
            resizable: false,
            height: 'auto',
	    width:400,
            modal: true,
	    close: function() {
                $('.progress').hide();
                $('.percent').hide();
                $('#status').hide();
            },
            buttons: {
                "Close": function() {
                    $(this).dialog( "close" );
		}
            }
        });
    });

    $('form').ajaxForm({
	beforeSend: function() {
	    $('.progress').show();
	    $('.percent').show();
	    $('#status').show();
            $('.bar').width('0%');
	    $('.percent').html('0%');
	    $('#status').empty();
	},
	uploadProgress: function(event, position, total, percentComplete) {
	    var percentVal = percentComplete + '%';
            $('.bar').width(percentVal);
	    $('.percent').html(percentVal);
	},
	complete: function(result) {
	    $('#status').html(result.responseText);
	    $('.bar').width('100%');
            $('.percent').html('100%');
	    //$( "#upload_data:ui-dialog" ).dialog( "destroy" );
	}
    }); 

    $('#btn_new_ws').bind('click', function(){
	if(MAP_EDITED != null){
            $( "#save_dialog:ui-dialog" ).dialog( "destroy" );   
            $( "#save_dialog" ).dialog({
	        resizable: false,
	        height:140,
	        modal: true,
	        buttons: {
	            "Save": function() {
	                 $(this).dialog( "close" );
			 saveEdits(MAP_EDITED, false);
			 createws();
		     },
		     "No": function() {
		     	 $(this).dialog( "close" );
			 createws();
		     },
                     "Cancel": function() {
		     	 $(this).dialog( "close" );
		     }
	         }
	     });
	}else{
	    createws();
	}
    getInfo();
    });

    $('#btn_open_ws').bind('click', function(){
      if(MAP_EDITED != null){
            $( "#save_dialog:ui-dialog" ).dialog( "destroy" );   
            $( "#save_dialog" ).dialog({
	        resizable: false,
	        height:140,
	        modal: true,
	        buttons: {
	            "Save": function() {
	                 $(this).dialog( "close" );
			 saveEdits(MAP_EDITED, false);
			 openws();
		     },
		     "No": function() {
		     	 $(this).dialog( "close" );
			 openws();
		     },
                     "Cancel": function() {
		     	 $(this).dialog( "close" );
		     }
	         }
	     });
	}else{
	    openws();
	}
    getInfo();
    });

    $('#btn_delete_ws').bind('click', function(){
      if(CURRENT_WORKSPACE != null){
            $( "#deletecurrentws_dialog:ui-dialog" ).dialog( "destroy" );   
            $( "#deletecurrentws_dialog" ).dialog({
	        resizable: false,
	        height:140,
	        modal: true,
	        buttons: {
	             "Delete": function() {
	                 $(this).dialog( "close" );
			 $.post($SCRIPT_ROOT + '/_delete_current_ws', {
    			 }, function(result) {
		    	     removeMaps();
			     addMaps({maps: [{name: "OSM - MapQuest"}, {name: "OSM - Standard"}]}, false);
        		     editor.setValue("");
			     $("#txtmapfile").attr("value", "");
			     $("#txtlogs").attr("value", "");
       			     stopEditing(MAP_EDITED);
			     CURRENT_WORKSPACE = null;
    			 });
		     },
                     "Cancel": function() {
		     	 $(this).dialog( "close" );
		     }
	         }
	     });
	}else{
	
	$("#deletewspass").attr("value", "");
        $('#selectdeletews').empty();
        $.post($SCRIPT_ROOT + '/_show_ws', {
        }, function(workspaces) {
            if(workspaces){
                for(ws in workspaces){   
                    $('#selectdeletews').append($("<option></option>").attr("value", workspaces[ws]).text(workspaces[ws])); 
                }
            }
        });

        $("#deletews").dialog({ 
            buttons: [
                {
                    text: "Delete",
                    click: function() {
                        if($('#selectdeletews').val()){

 			$( "#deletews_dialog:ui-dialog" ).dialog( "destroy" );   
            		$( "#deletews_dialog" ).dialog({
	        	resizable: false,
	        	height:140,
	       	 	modal: true,
	        	buttons: {
	             	    "Delete": function() {
	                         $(this).dialog( "close" );
			 	 $.post($SCRIPT_ROOT + '/_delete_ws', {
    			             name: $('#selectdeletews').val(),
				     password: $('#deletewspass').val()
				 }, function(result) {
				     if(result == "Invalid workspace" || result == "Invalid password") {
				         alert(result);
                                     }else {
					 $("#deletews").dialog("close");
				     }
    			         });
		            },
                            "Cancel": function() {
		     	        $(this).dialog( "close" );
		            }	                
			}
			});
			}
			return false;
		    }
                }
            ],
            resizable: false 
        });
    }
});

     $('#selectws2').bind('blur', function()
    {
	$('#selecttemplate2').empty();
        $('#selecttemplate2').append($("<option></option>").attr("value", "*default").text("*default"));
        $('#selecttemplate2').append($("<option></option>").attr("value", "*light-grey").text("*light-grey"));
        $.post($SCRIPT_ROOT + '/_show_templates', {
	    ws_name: $('#selectws2').val()
        }, function(templates) {
            if(templates){
                for(tmp in templates){   
                    $('#selecttemplate2').append($("<option></option>").attr("value", templates[tmp]).text(templates[tmp])); 
                }
            }
        });
    });

    $('#btn_new_map').bind('click', function(){
        if(CURRENT_WORKSPACE != null){
            $('#selecttemplate').empty();
            $('#selecttemplate').append($("<option></option>").attr("value", "*default").text("*default"));
            $('#selecttemplate').append($("<option></option>").attr("value", "*light-grey").text("*light-grey"));
            $("#mapname").attr("value", "");

            $.post($SCRIPT_ROOT + '/_show_templates', {
            }, function(templates) {
                if(templates){
                    for(tmp in templates){   
                        $('#selecttemplate').append($("<option></option>").attr("value", templates[tmp]).text(templates[tmp])); 
                    }
                }
            });
	 
            $("#newmap").dialog({ 
                buttons: [
		    {
			text: "+",
			click: function() {
			    $(this).dialog( "close" );
 			    $("#mapname2").attr("value", $("#mapname").val())
			    newMap2();
			}
		    },
                    {
                        text: "Create",
                        click: function() {
                            if($('#selecttemplate').val()){
                                $.post($SCRIPT_ROOT + '/_create_map', {
                                    name: $('#mapname').val(),
                                    template: $('#selecttemplate').val()
                                },function(map) {
                                    if(map != "Existing" && map != "Invalid name"){
                                        $("#newmap").dialog("close");
                                        addMaps(map, true)
                                    } else{
                                        alert("\"" + $('#mapname').val() + "\" already existing or is invalid.");
                                    }
                                });
                            }
                            return false;
                        }
                    }
                ],
                resizable: false
            });
        } else{
            alert("Create or open workspace first");
        }
    });

    $('#btn_cache').bind('click', function(){
            $('#selectmap').empty();
		
            $.post($SCRIPT_ROOT + '/_show_templates', {
              }, function(templates) {
              if(templates){
              for(tmp in templates){   
              $('#selectmap').append($("<option></option>").attr("value", templates[tmp]).text(templates[tmp])); 
              }
              }
            });

            $("#cachemap").dialog({ 
                buttons: [
                    {
                        text: "Start",
                        click: function() {
                            var extentType = $('input[name=extent]:radio:checked').val();
                            if(extentType == "set"){
			        var extent = $("#minX").val() + "," + $("#minY").val() + "," + $("#maxX").val() + "," + $("#maxY").val();  
                            }else{
                                var extent = map.getExtent().toString();
                            }
				alert(extent);
                            if($('#selectmap').val()){
                                $.post($SCRIPT_ROOT + '/_cache_map', {
                                    name: $('#selectmap').val(),
                                    extent: extent
                                }, function(caching) {
                                    alert(caching);
                                });
                            }
                            return false;
                        }
                    }
                ],
                resizable: false
            });
    });

    $('input[name=extent]:radio').change(function(){
        var checked = $('input[name=extent]:radio:checked').val();
        if(checked == "set"){
            $('#maxY, #minX, #maxX, #minY').show();
        }
        else{
            $('#maxY, #minX, #maxX, #minY').hide();
        }
    });

    $('input[name=extentHP]:radio').change(function(){
        var checked = $('input[name=extentHP]:radio:checked').val();
        if(checked == "set"){
            $('#latitude, #longitude, #scalelevel, #latlbl, #lonlbl, #scalelbl').show();
        }
        else{
            $('#latitude, #longitude, #scalelevel, #latlbl, #lonlbl, #scalelbl').hide();
        }
    })
*/
    /*--------------------------------
      Map and layers
    --------------------------------*/
/*
    var mapOptions = {
        allOverlays: true,
        projection: new OpenLayers.Projection("EPSG:900913"),
        displayProjection: new OpenLayers.Projection("EPSG:4326"),
        maxExtent: new OpenLayers.Bounds(-20037508.34,-20037508.34,20037508.34,20037508.34),
        maxResolution: 156543.0339,
        units: "m",
        scales:  [50000000, 20000000, 10000000, 4000000, 1000000, 500000, 150000, 100000, 50000, 25000, 15000, 6000]
    };
*/
/*
    map = new OpenLayers.Map('map', mapOptions);
    map.addControls([new OpenLayers.Control.Scale(), new OpenLayers.Control.MousePosition()]);

    OpenLayers.Layer.MapQuestOSM = OpenLayers.Class(OpenLayers.Layer.XYZ, {
        name: "OSM - MapQuest",
        sphericalMercator: true,
        url: 'http://otile1.mqcdn.com/tiles/1.0.0/osm/${z}/${x}/${y}.png',
        clone: function(obj) {
            if (obj == null) {
                obj = new OpenLayers.Layer.OSM(
                    this.name, this.url, this.getOptions());
            }
            obj = OpenLayers.Layer.XYZ.prototype.clone.apply(this, [obj]);
            return obj;
        },
        CLASS_NAME: "OpenLayers.Layer.MapQuestOSM"
    });

    var layerOSM = new OpenLayers.Layer.OSM({isBaseLayer: true, visibility: true});
    layerOSM.name = "OSM - Standard";

    var layerMapQuestOSM = new OpenLayers.Layer.MapQuestOSM();
    layerMapQuestOSM.setIsBaseLayer(false);

    map.addLayers([layerOSM, layerMapQuestOSM]);
    //addMaps({maps:  {name: "OSM - MapQuest"}, {name: "OSM - Standard"}]}, false);
    map.setCenter(new OpenLayers.LonLat(-71.05,46.85).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()), 13);
    $('#txtScale').val(map.zoom);
*/

    //registerEvents();

    /*--------------------------------
      Hot spots
    --------------------------------*/
/*
    HOTSPOTS = [{"name": "USA", "lon": -99, "lat":40, "scale":4},
                {"name": "Alabama - Prattville", "lon": -86.46, "lat":32.46, "scale":10},
                {"name": "Arizona - Prescott", "lon": -112.46, "lat":34.5, "scale":12},
                {"name": "California - Los Angeles", "lon": -118.39, "lat":33.95, "scale":10},
                {"name": "California - San Francisco", "lon": -122.44, "lat":37.77, "scale":13},
                {"name": "Hawaii - Honolulu", "lon": -157.98, "lat":21.47, "scale":10},
                {"name": "Illinois - Chicago", "lon": -88.09, "lat":41.83, "scale":10},
                {"name": "New York - New York", "lon": -74.00, "lat":40.72, "scale":13},
                {"name": "Quebec - Quebec", lon: -71.35, lat:46.78, scale:11}]
*/    
});
      

/*
function registerEvents() { 

    var onMapZoomEnd = function(e){
	$('#txtScale').val(map.zoom);
    }

    var onMapMoveEnd = function(e) {
	if (DEBUG==1){
	    $('.loadingCode').css('display', 'block');
	    setTimeout(function(){update();},1000);
	    function update(){
		var nbok = 0;
		for (var nb=MAPS.length*-1; nb<=0; nb++){
		    if($('.olTileImage').eq(nb).css('visibility')=='hidden'){
			//if($('.olLayerDiv').last().css('visibility')=='hidden'){
			setTimeout(function(){update();},1000);
			break;
		    }else{
			nbok++;
			if (nbok > MAPS.length){
			    $.getJSON($SCRIPT_ROOT + '/_load_debug', {
			    }, function(data) {
				$('#txtdebug').val(data.text);
				$('.loadingCode').css('display', 'none');
			    });
			}
		    }
		}
	    }
	}
    }

    map.events.on({
	"moveend": onMapMoveEnd,
	"zoomend": onMapZoomEnd
    });
}
  */