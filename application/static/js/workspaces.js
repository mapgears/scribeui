function addMaps(maps, editable){
    /*=======================================
      Ajout des maps et des layers
    =======================================*/ 
    var maps = maps.maps;
    for(i = 0; i <  maps.length; i++){
        MAPS.push(maps[i]);
        var mapId = 'acc-map-' + MAPS.length;
        //MAPS[MAPS.length].id = mapId;
        //var btnLockUnlock = "<button id=\"acc-lock-unlock-" + MAPS.length + "\" name=\"" + maps[i].name + "\" class=\"acc-btn-lock-unlock acc-btn-unlocked\"></button>";
        
        //$('#layers').append($("<div><h3><input type=\"checkbox\" checked=\"true\" value=\"" + maps[i].name + "\">" + maps[i].name + btnLockUnlock + btnEdit + "</h3><div name=\"" + maps[i].name + "\" class=\"acc-map\" id=\"" + mapId + "\"></div></div>"));
        if(editable == true){
	    var btnUpload = "<button id=\"acc-upload-" + MAPS.length + "\" name=\"" + maps[i].name + "\" class=\"acc-btn-edit-editing acc-btn-upload\"></button>";
	    var btnAdd = "<button id=\"acc-add-" + MAPS.length + "\" name=\"" + maps[i].name + "\" class=\"acc-btn-edit-editing acc-btn-add\"></button>";
	    var btnRemove = "<button id=\"acc-remove-" + MAPS.length + "\" name=\"" +maps[i].name + "\" class=\"acc-btn-edit-editing acc-btn-remove\"></button>";
            var btnEdit = "<button id=\"acc-edit-" + MAPS.length + "\" name=\"" + maps[i].name + "\" class=\"acc-btn-edit-editing acc-btn-edit\"></button>";
	    var btnDelete = "<button id=\"acc-delete-" + MAPS.length + "\" name=\"" + maps[i].name + "\" class=\"acc-btn-edit-editing acc-btn-delete\"></button>";
            $('#layers').prepend($("<div class=\"acc-container\"><h3 name=\"" + maps[i].name + "\"><input type=\"checkbox\" checked=\"true\" value=\"" + maps[i].name + "\">" + maps[i].name + btnDelete + btnEdit + btnRemove + btnAdd + btnUpload + "</h3><div name=\"" + maps[i].name + "\" class=\"acc-map\" id=\"" + mapId + "\"></div></div>"));
            for(j = 0; j < maps[i].mapfiles.length; j++){
                var layerId = "layer-" + MAPS.length + '-' + j;
                MAPS[MAPS.length - 1].mapfiles[j].id = layerId;
                var mapName = maps[i].name;
                $("#" + mapId).append($("<li><a id=\"" + layerId + "\" class=\"layer\">" + maps[i].mapfiles[j].name + "</a></li>"));
                $("#" + layerId).bind('click', function(){
                    var id = $(this).attr('id');
                    var layerName = $(this).html();
                    editLayer(id, layerName);
                });
            }
	    
	    $("#acc-upload-" + MAPS.length).bind('click', function(e){
                var mapname = e.target.getAttribute("name");
                $('#uploadMap').attr("value", mapname);
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


	    $("#acc-add-" + MAPS.length).bind('click', function(e){
                e.stopPropagation();
		var mapname = e.target.getAttribute("name");
		var mapid = e.target.getAttribute("id");
		$("#layername").attr("value", "");
		$( "#newlayer_dialog:ui-dialog" ).dialog( "destroy" );
		$("#newlayer").dialog({
		    resizable: false,
                    height:170,
                    modal: true,
		    buttons: 
			{
			    "Add": function() {
				    $(this).dialog( "close" );
				    $.post($SCRIPT_ROOT + '/_add_layer', {
					map: mapname,
					layer: $('#layername').val()
				    }, function(result) {
					if(result != "OK") {
					    alert(result);
					}else {
					    var n = $("div[name="+mapname+"] li").length;
					    var layerId = "layer-" + mapid.substring(8) + '-' + n;
					    $("div[name="+mapname+"]").append($("<li><a id=\"" + layerId + "\" class=\"layer\">" + $('#layername').val() + "</a></li>"));
					    layer = {"content":"", "name": $('#layername').val(), "id":layerId};
					    MAPS[mapid.substring(8)-1].mapfiles.push(layer);			    
					    for (i=0;i<MAPS[mapid.substring(8)-1].mapfiles.length;i++){
						if(MAPS[mapid.substring(8)-1].mapfiles[i].name == "osmbase"){
						    nlayer=i;
						    i=MAPS[mapid.substring(8)-1].mapfiles.length;
						}
					    }
					    
					    try {
                                                streditor=MAPS[mapid.substring(8)-1].mapfiles[nlayer].editor.getValue();
						str = streditor.replace(/##------------------##/g,"#include \""+$('#layername').val()+".map\"\n##------------------##");
						MAPS[mapid.substring(8)-1].mapfiles[nlayer].editor.setValue(str);
					    }catch(e){
					    str=MAPS[mapid.substring(8)-1].mapfiles[nlayer].content.replace(/##------------------##/g,"#include \""+$('#layername').val()+".map\"\n##------------------##");
					    }
					    MAPS[mapid.substring(8)-1].mapfiles[nlayer].content=str;
					    
					    $("#" + layerId).bind('click', function(){	
						var id = $(this).attr('id');
						var layerName = $(this).html();
						editLayer(id, layerName);
					    });
					}
				    });
			    },
			    "Cancel": function() {
                                $(this).dialog( "close" );
			    }
			}
		});
	    });




            $("#acc-remove-" + MAPS.length).bind('click', function(e){
                e.stopPropagation();
                var mapname = e.target.getAttribute("name");
                var mapid = e.target.getAttribute("id");
                $("#removelayername").empty();
		for(var mfid=0; mfid<MAPS[mapid.substring(11)-1].mapfiles.length; mfid++){
                    var mf=(MAPS[mapid.substring(11)-1].mapfiles[mfid].name);
		    if (mf!="symbol" && mf != "osmbase"){
			$('#removelayername').append($("<option></option>").attr("value", mf).text(mf));
		    }
		}
                $("#removelayer_dialog:ui-dialog" ).dialog( "destroy" );
                $("#removelayer").dialog({
                    resizable: false,
                    height:170,
                    modal: true,
                    buttons:
                    {
                        "Remove": function() {
                            $(this).dialog( "close" );
			    var removelayername = $('#removelayername').val();
			    $.post($SCRIPT_ROOT + '/_remove_layer', {
                                map: mapname,
                                layer: removelayername
                            }, function(result) {
                                if(result != "OK") {
                                    alert(result);
                                }else {
				    for(var mfid=0; mfid<MAPS[mapid.substring(11)-1].mapfiles.length; mfid++){
				
					if ((MAPS[mapid.substring(11)-1].mapfiles[mfid].name) == removelayername){
					    $('#acc-map-'+mapid.substring(11)+' li:eq('+mfid+')').remove();
					    mfid++;
					    while (mfid<MAPS[mapid.substring(11)-1].mapfiles.length){
						MAPS[mapid.substring(11)-1].mapfiles[mfid-1]=MAPS[mapid.substring(11)-1].mapfiles[mfid];
						var newmfid=mfid-1;
						var newid="layer-"+mapid.substring(11)+"-"+newmfid;
						MAPS[mapid.substring(11)-1].mapfiles[mfid].id = newid;
						$("#layer-"+mapid.substring(11)+"-"+mfid).attr("id",newid);
						var neweditorid="layereditorlayer-"+mapid.substring(11)+"-"+newmfid;
						$("#layereditorlayer-"+mapid.substring(11)+"-"+mfid).attr("id",neweditorid);
						mfid++;
					    }
					}
				    }
				    MAPS[mapid.substring(11)-1].mapfiles.pop();                         
				    for(var mfid=0; mfid<MAPS[mapid.substring(11)-1].mapfiles.length; mfid++){
					if ((MAPS[mapid.substring(11)-1].mapfiles[mfid].name) == "osmbase"){
					    var nlayer = mfid;
					    //var oldtxt = MAPS[mapid.substring(11)-1].mapfiles[idtmp].content;
					    var searchfor= "#include \""+removelayername+".map\"\n";
					    //MAPS[mapid.substring(11)-1].mapfiles[idtmp].content = oldtxt.replace(new RegExp(searchfor, 'g'),"");
					    
	                                    try {
                                                streditor=MAPS[mapid.substring(11)-1].mapfiles[nlayer].editor.getValue();
                                                str = streditor.replace(new RegExp(searchfor, 'g'),""); 
                                                MAPS[mapid.substring(11)-1].mapfiles[nlayer].editor.setValue(str);
                                            }catch(e){
						str=MAPS[mapid.substring(11)-1].mapfiles[nlayer].content.replace(new RegExp(searchfor, 'g'),""); 
                                            }
                                            MAPS[mapid.substring(11)-1].mapfiles[nlayer].content=str;

					}
				    }
				}
			    });
                            },
                            "Cancel": function() {
                                $(this).dialog( "close" );
                            }
                    }
                });
	    });




            $("#acc-edit-" + MAPS.length).bind('click', function(e){
                e.stopPropagation();
                if(MAP_EDITED == null || MAP_EDITED == e.target.getAttribute("name")){
		    //alert(MAP_EDITED + " " + e.target.getAttribute("name"));
                    var id = $(this).attr("id").replace("edit", "save");
                    var mapToEdit = e.target.getAttribute("name");
                    MAP_EDITED = mapToEdit;
                    /*
                      $.getJSON($SCRIPT_ROOT + '/_map_status', {
                      map: mapToEdit
                      }, function(status) {
                      var status = status;
                      });
                    */
                    //            if(status == "unlocked"){
                    if($(".acc-btn-editing").attr("id")){
                        if($(this).hasClass("acc-btn-stop-editing")){
                            var self = this;
                            $( "#save_dialog:ui-dialog" ).dialog( "destroy" );   
		            $( "#save_dialog" ).dialog({
			        resizable: false,
			        height:140,
			        modal: true,
			        buttons: {
				    "Save": function() {
				        $(this).dialog( "close" );
                                        $(self).removeClass("acc-btn-stop-editing");
                                        $(".acc-btn-editing").remove();
				        saveEdits(MAP_EDITED, false);
                                        editor.setValue("");
				        $("#txtmapfile").attr("value", "");
					$("#txtlogs").attr("value", "");
                                        stopEditing(MAP_EDITED);
				    },
				    "No": function() {
				        $(this).dialog( "close" );
					$.post($SCRIPT_ROOT + '/_backup', {
                	                }, function(maps) {
					});
                                        $(self).removeClass("acc-btn-stop-editing");
                                        $(".acc-btn-editing").remove();
                                        editor.setValue("");
					$("#txtmapfile").attr("value", "");
					$("#txtlogs").attr("value", "");
					mapNoSave = MAP_EDITED;
					stopEditing(MAP_EDITED);
					$.post($SCRIPT_ROOT + '/_open_map', {
                	                }, function(maps) {
					    var maps = maps.maps;
					    for(i = 0; i <  maps.length; i++){
					        if(maps[i].name == mapNoSave){
						    for(j = 0; j < MAPS.length; j++){
			         		        if(MAPS[j].name == mapNoSave){
							    for(k = 0; k < MAPS[j].mapfiles.length; k++){
								for(m = 0; m < maps[i].mapfiles.length; m++){
								    if(MAPS[j].mapfiles[k].name == maps[i].mapfiles[m].name){
				     			    		MAPS[j].mapfiles[k].content = maps[i].mapfiles[m].content;
									if (MAPS[j].mapfiles[k].editor){
									    MAPS[j].mapfiles[k].editor.setValue(maps[i].mapfiles[m].content);
									}
								    }
								} 
							    }
							    break;    
			        		 	} 
       			     			    }
						    break;
						}
					    }				
			   	        });
				    },
                                    "Cancel": function() {
				        $(this).dialog( "close" );
				    }
			        }
		            });
                        }
                    }else {
			$(this).toggleClass("acc-btn-stop-editing");
                        $(this).after($("<button id=\"" + id + "\" name=\"" + mapToEdit + "\" class=\"acc-btn-edit-editing acc-btn-editing\"></button>"));
                        $("#" + id).bind('click', function(e){
                            e.stopPropagation();
                            saveEdits(e.target.name, false);
                            //$(this).remove();
                        });

                        $.getJSON($SCRIPT_ROOT + '/_load', {
                            mapToEdit: mapToEdit
                        }, function(data) {
                            editor.setValue(data.text);
			    getInfo();
                        });

			$.getJSON($SCRIPT_ROOT + '/_load_mapfile_generated', {
			   mapToEdit: mapToEdit
                        }, function(data) {
                            $("#txtmapfile").attr("value", data.text);
                        });

			$("#acc-map"+id.substring(8)).show();

                        /*Ajouter dequoi pour changer l'icone du crayon pour un autre indiquant que l'édition est en cours et permettant de l'arrêter*/
                        /* var btnLockUnlock = $('button.acc-btn-lock-unlock[name =\'' + mapToEdit + '\']');
                           if(btnLockUnlock.hasClass('acc-btn-unlocked')){ //Vérifier si elle est lockée localement ou par un autre user. Dans ce dernier cas on ne doit pas pouvoir la délocker
                           btnLockUnlock.removeClass('acc-btn-unlocked');
                           btnLockUnlock.addClass('acc-btn-locked');
                           var status = "locked";

                           $.post($SCRIPT_ROOT + '/_lock_unlock', {
                           map: mapToEdit,
                           status: status
                           }, function(data) {

                           });
                           }*/
                        
                    }
                }

            });
        }else {
            $('#layers').append($("<div class=\"acc-container\"><h3 name=\"" + maps[i].name + "\"><input type=\"checkbox\" checked=\"true\" value=\"" + maps[i].name + "\">" + maps[i].name + "</h3></div>"));
        }
        
        $("#" + mapId).sortable({
	    axis: "y",
	    handle: "h4",
	    stop: function(event, ui) {
		// IE doesn't register the blur when sorting
		// so trigger focusout handlers to remove .ui-state-focus
		ui.item.children( "h3" ).triggerHandler( "focusout" );
	    }
	});

        if(maps[i].url){
            var layer = new OpenLayers.Layer.WMS(
                maps[i].name,
                maps[i].url,
                {
                    layers: "default",
                    format: "image/png"
                }, {
                    singleTile: true,
                    projection: new OpenLayers.Projection("EPSG:900913"),
                    maxExtent: new OpenLayers.Bounds(-20037508.34,-20037508.34,20037508.34,20037508.34)
                }
            );
            map.addLayers([layer]);
        }




	$("#acc-delete-" + MAPS.length).bind('click', function(e){
            e.stopPropagation();
	    var self = this;
	/*    var indice = 0;
	    for (var id in MAPS) {
		if (MAPS[id].name == this.name) {
    		    //MAPS.splice(id,1);
		    map.removeLayer(map.layers[id]);
		    break;
		}
	    }*/

	    var layer = map.getLayersByName(this.name)[0];
	    
            $( "#deletemap_dialog:ui-dialog" ).dialog( "destroy" );   
            $( "#deletemap_dialog" ).dialog({
	        resizable: false,
	        height:140,
	        modal: true,
	        buttons: {
	             "Delete": function() {
	                 $(this).dialog( "close" );
			 map.removeLayer(layer);
			 $.post($SCRIPT_ROOT + '/_delete_map', {
			     mapToDelete: e.target.getAttribute("name")
    			 }, function(result) {
			     $(self).parent().parent().remove();
			     for(i = 0; i < MAPS.length; i++){
			         if(MAPS[i].name == e.target.getAttribute("name")){
				     /*while(i < MAPS.length-1){					
				         MAPS[i] = MAPS[i+1];
					 i++;
				     }
				     MAPS.pop();*/
				     MAPS[i].name = "";
				     break;
			         }
       			     }
			     changeDisplayOrder();
			     
			    /* $.post($SCRIPT_ROOT + '/_open_map', {
                             }, function(maps) {
				 removeMaps();
			     	 addMaps({maps: [{name: "OSM - MapQuest"}, {name: "OSM - Standard"}]}, false);
			         addMaps(maps, true);
			     });*/

			
			     if(MAP_EDITED == null || MAP_EDITED == e.target.getAttribute("name")){
        		         editor.setValue("");
			         $("#txtmapfile").attr("value", "");
			         $("#txtlogs").attr("value", "");
       			         stopEditing(MAP_EDITED);
			     }
    			 });
		     },
                     "Cancel": function() {
		         $(this).dialog( "close" );
		     }
	         }
	     });
            });

        

        
//            }
            
/*
            if($(this).hasClass('acc-btn-edit')){
                $(this).toggleClass('acc-btn-editing');
*/
/*                $.getJSON($SCRIPT_ROOT + '/_load', {
                    mapToEdit: mapToEdit
                }, function(data) {
                    editor.setValue(data.text);
                    editor.refresh();
                });

                var btnLockUnlock = $('button.acc-btn-lock-unlock[name =\'' + mapToEdit + '\']');
                if(btnLockUnlock.hasClass('acc-btn-unlocked')){ 
                    btnLockUnlock.removeClass('acc-btn-unlocked');
                    btnLockUnlock.addClass('acc-btn-locked');
                    var locked = true;

                    $.getJSON($SCRIPT_ROOT + '/_lock_unlock', {
                        map: mapToEdit,
                        locked: locked
                    }, function(data) {

                    });
                }
*/
/*            }else if($(this).hasClass('acc-btn-editing')){ 
                $(this).toggleClass('acc-btn-edit');
                saveEdits()
            }
*/
/*
        $("#acc-lock-unlock-" + MAPS.length).bind('click', function(e){
            e.stopPropagation();
            
            var mapToLockUnlock = e.target.getAttribute("name");
            var btnEdit = $('button.acc-btn-edit[name =\'' + mapToLockUnlock + '\']');

            if($(this).hasClass('acc-btn-unlocked')){
                $(this).removeClass('acc-btn-unlocked');
                $(this).addClass('acc-btn-locked');
                var status = "locked";
            }else if($(this).hasClass('acc-btn-locked')){ //Vérifier si elle est lockée localement ou par un autre user. Dans ce dernier cas on ne doit pas pouvoir la délocker
                if(!btnEdit.hasClass('acc-btn-editing')){
                    $(this).removeClass('acc-btn-locked');
                    $(this).addClass('acc-btn-unlocked');
                    var status = "unlocked";
                }
            }

            if(status){
                $.post($SCRIPT_ROOT + '/_lock_unlock', {
                    map: mapToLockUnlock,
                    status: status
                }, function(data) {

                });
            }
        });
    */
    }
   
    $("#layers").accordion('destroy');
    $("#layers").accordion({
	header: "> div > h3",
        collapsible: true,
        icons: false
    }).sortable({
	axis: "y",
	handle: "h3",
	stop: function(event, ui) {
	    // IE doesn't register the blur when sorting
	    // so trigger focusout handlers to remove .ui-state-focus
	    ui.item.children("h4").triggerHandler("focusout");
            
            changeDisplayOrder();
	}
    });

    $('#layers input[type="checkbox"]').click(function(e) {
        e.stopPropagation();
        var layer = map.getLayersByName(e.target.value)[0];
        layer.setVisibility(e.target.checked);
    });

changeDisplayOrder();
}

function changeDisplayOrder(){
    var maps =  $('.acc-container > h3').get(); 
    for(i = maps.length - 1; i >= 0; i--){
        var layerName = maps[i].getAttribute("name"); 
        var layer = map.getLayersByName(layerName)[0];
        map.setLayerZIndex(layer, maps.length - (i + 1));
    }
}

/*
function createMap(map){
    $.getJSON($SCRIPT_ROOT + '/_load', {
        mapToEdit: mapToEdit
    }, function(data) {
        editor.setValue(data.text);
    });

    addMap([map]);
    
}
*/
function editLayer(layerId, layerName){
    //var status = "unlocked";
    var p1 = layerId.search('-'); 
    var tmp = layerId.substring(p1 + 1); 
    var mapId = "acc-map-" + tmp.substring(0, tmp.search('-'));
    var mapName = $("#" + mapId).attr("name");
/* 
    $.getJSON($SCRIPT_ROOT + '/_map_status', {
        map: mapName
    }, function(status) {
        var status = status;
    });
*/    
//    if(status == "unlocked"){
    if(mapName == MAP_EDITED){
        for(i = 0; i < MAPS.length; i++){
            if(MAPS[i].name == mapName){
                for(j = 0; j < MAPS[i].mapfiles.length; j++){
                    if(MAPS[i].mapfiles[j].name == layerName){
                        var layer = MAPS[i].mapfiles[j];
                        var layerEditorId = "layereditor" + layerId;
                        break;
                    }
                }
            }
        }
	//alert(layer.content);
        try {
            var oldEditor = $("#" + layerEditorId);
            var content = layer.editor.getValue();

            /*$.getJSON($SCRIPT_ROOT + '/_save_layer', {
                map: mapName,
                layer: layerName,
                content: content
            }, function() {
                layerEditor.toTextArea();
                oldEditor.remove();
            });*/
            /*Juste pour tester mais doit normalement être dans la callback*/
            layer.content = content;
            layer.editor.toTextArea();
            oldEditor.remove();
        }catch(e){
            var layerTag = $("#" + layerId);
            layerTag.after($("<textarea id=\"layereditor" + layerId + "\"></textarea>"));
            var layerEditor = CodeMirror.fromTextArea(document.getElementById("layereditor" + layerId), {
                lineNumbers: true,
                indentUnit: 4,
                tabMode: "shift",
                matchBrackets: true
            });
            layerEditor.setValue(layer.content);
            layerEditor.refresh();

            layer.editor = layerEditor;

            $("#layereditor" + layerId + "~.CodeMirror").toggleClass("layerMirror");
	  //  getInfo();
        }
/*
        $.getJSON($SCRIPT_ROOT + '/_request_mapfile', {
            mapfile: layerName,
        }, function(content) {
            var layer = $("#" + layerId);
            layer.after($("<textarea id=\"layereditor" + layerId + "\"></textarea>"));
            layerEditor = CodeMirror.fromTextArea(document.getElementById("layereditor"), {
                lineNumbers: true,
                value: content,
                indentUnit: 4,
                tabMode: "shift",
                matchBrackets: true
            });

            $("#layereditor~.CodeMirror").attr("id", "layerMirror");
        });
*/ 
    }
//    }
};
/*
function saveLayer(layerEditor){
    //Sauvegarder le mapfile correspondant et enlever l'éditeur en callback
    layerEditor.remove();
}
*/
/*
function addMap(){}
*/
function saveEdits(mapToSave, commit){
    for(i = 0; i < MAPS.length; i++){
        if(mapToSave == MAPS[i].name){
            for(j = 0; j < MAPS[i].mapfiles.length; j++){
                try{
                    //var oldEditor = $("#" + MAPS[i].mapfiles[j].id);
                    MAPS[i].mapfiles[j].content =  MAPS[i].mapfiles[j].editor.getValue();
                    layer.editor.toTextArea();
                    //oldEditor.remove();
                } catch(e){}
            }
	    
	    if(commit == true){
		$.post($SCRIPT_ROOT + '/_save_backup', {
                }, function(data) {
                });
	    }else{
		$.post($SCRIPT_ROOT + '/_delete_backup', {
                }, function(data) {
                });	
	    }

            var data = {style: editor.getValue(), mapfiles: MAPS[i].mapfiles}
             $.post($SCRIPT_ROOT + '/_save', {
                 //style: editor.getValue(),
                 //mapfiles: MAPS[i].mapfiles
                 data: JSON.stringify(data)
            }, function(status) {
                if(commit == true){
                    $.post($SCRIPT_ROOT + '/_commit', {
                    }, function(data) {
                        $('#txtlogs').attr("value", data.result);
		        $.getJSON($SCRIPT_ROOT + '/_load_mapfile_generated', {
			    mapToEdit: mapToSave
                        }, function(data2) {
                            $("#txtmapfile").attr("value", data2.text);
			    for(var k=0; k < map.layers.length; k++){
				if(map.layers[k].name == mapToSave){
				    map.layers[k].redraw(true);
				    break;
				}
			    }
			    $('.loadingMap').css('display', 'none');
                        });
                        });
                    return false;
                }else{
                    alert(status);
                }
            });
            break;
        }
    }
}

function createws(){
    $("#newwsname").attr("value", "");
    $("#newwspass").attr("value", "");
    $("#createws_dialog:ui-dialog" ).dialog( "destroy" );
    $("#createws").dialog({ 
            buttons: [
                {
                    text: "Create",
                    click: function() { 
                        if($('#newwsname').val()){ 
                            $.post($SCRIPT_ROOT + '/_create_new_ws', {
                                name: $('#newwsname').val(),
                                password: $('#newwspass').val()
                            }, function(status) {
                                if(status == "OK") {
                                    removeMaps();
                                    CURRENT_WORKSPACE = $('#newwsname').val();
                                    addMaps({maps: [/*{name: "W2GI", url: "http://172.16.20.91/cgi-bin/mapserv?map=/srv/www/htdocs/mapserver-utils-imposm/osm-w2gi.map"},*/ {name: "OSM - MapQuest"}, {name: "OSM - Standard"}]}, false);
                                    $('#createws').dialog("close");
                                    editor.setValue("");
				    $("#txtmapfile").attr("value", "");
				    $("#txtlogs").attr("value", "");
				    stopEditing(MAP_EDITED);
                                    /*$.post($SCRIPT_ROOT + '/_open_ws', {
                                        name: $('#newwsname').val(),
                                        password: $('#newwspass').val()
                                    }, function(maps) {
                                        if(maps) {
                                            $(this).dialog("close");
                                            addMaps.call(maps);
                                        }
                                    });*/
                                }else if (status == "Existing") {
                                    alert("Name already used");
				}else if (status =="Invalid name") {
				    alert("Name is invalid");
                                }else {
                                    alert("An error occured");
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

function openws(){
	$("#wspass").attr("value", "");
        $('#selectws').empty();
        $.post($SCRIPT_ROOT + '/_show_ws', {
        }, function(workspaces) {
            if(workspaces){
                for(ws in workspaces){   
                    $('#selectws').append($("<option></option>").attr("value", workspaces[ws]).text(workspaces[ws])); 
                }
            }
        });

        $("#openws").dialog({ 
            buttons: [
                {
                    text: "Open",
                    click: function() {
                        if($('#selectws').val()){
                            $.post($SCRIPT_ROOT + '/_open_ws', {
                                name: $('#selectws').val(),
                                password: $('#wspass').val()
                            }, function(maps) {
                                if(maps == "Invalid workspace" || maps == "Invalid password") {
                                    alert(maps);
                                }else {
			            CURRENT_WORKSPACE = $('#selectws').val();
                                    $("#openws").dialog("close");
                                    removeMaps();
                                    addMaps({maps: [/*{name: "W2GI", url: "http://172.16.20.91/cgi-bin/mapserv?map=/srv/www/htdocs/mapserver-utils-imposm/osm-w2gi.map"},*/ {name: "OSM - MapQuest"}, {name: "OSM - Standard"}]}, false);
                                    addMaps(maps, true);
                                    editor.setValue("");
				    $("#txtmapfile").attr("value", "");
				    $("#txtlogs").attr("value", "");
				    stopEditing(MAP_EDITED);
				    
				    $.post($SCRIPT_ROOT + '/_show_hotspot', {
				    }, function(hotspots) {
					$("#selectHotSpot").html('');
					HOTSPOTS = [];
					if (hotspots){

					    hotspots = hotspots.hotspots;
					    for (hs in hotspots){
						$("#selectHotSpot").append('<option value=\"'+hotspots[hs].hotspot_name+'\">'+hotspots[hs].hotspot_name+'</option>');
						HOTSPOTS[hs]={"name": hotspots[hs].hotspot_name, "lon": hotspots[hs].longitude, "lat":hotspots[hs].latitude, "scale":hotspots[hs].scalelvl}
						
					    }
					}
				    });
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


function newMap2(){
    $("#wspass2").attr("value", "");
    $('#selectws2').empty();
    $.post($SCRIPT_ROOT + '/_show_ws', {
    }, function(workspaces) {
	$('#selectws2').append($("<option></option>").attr("value", "").text(""));
        if(workspaces){
            for(ws in workspaces){
                $('#selectws2').append($("<option></option>").attr("value", workspaces[ws]).text(workspaces[ws])); 
            }
        }
    });

    $('#selecttemplate2').empty();
    $('#selecttemplate2').append($("<option></option>").attr("value", "*default").text("*default"));
    $('#selecttemplate2').append($("<option></option>").attr("value", "*light-grey").text("*light-grey"));
    $.post($SCRIPT_ROOT + '/_show_templates', {
        ws_name: $('selectws2 option:first-child').val()
        }, function(templates) {
            if(templates){
                for(tmp in templates){   
                    $('#selecttemplate2').append($("<option></option>").attr("value", templates[tmp]).text(templates[tmp])); 
                }
            }
    });

    $("#newmap2").dialog({ 
        buttons: [
            {
            text: "Create",
            click: function() {
                if($('#selectws2').val()){
                    $.post($SCRIPT_ROOT + '/_create_map', {
                        name: $('#mapname2').val(),
                        template: $('#selecttemplate2').val(),
                        ws_template: $('#selectws2').val(),
	 	        password: $('#wspass2').val()
                    },function(map) {
                    if(map == "Existing"){
			alert("\"" + $('#mapname').val() + "\" already existing.");
                    } else if(map == "Invalid workspace" || map == "Invalid password" || map == "Invalid name"){
   			alert(map);
		    } else{
                        $("#newmap2").dialog("close");
                        addMaps(map, true)
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






function removeMaps(){
    try{
        $("#layers").find("div").remove();
    }catch(e){}

    MAPS = [];

    for(i = 0; i < map.layers.length; i++){
        if(map.layers[i].name != "OSM - MapQuest" && map.layers[i].name != "OSM - Standard"){
            map.removeLayer(map.layers[i]);
	    i -= 1;
        }else{
	    map.layers[i].setVisibility(true);
        }
    }

    if(map.baseLayer && map.baseLayer.name != "OSM - MapQuest" && map.baseLayer.name != "OSM - Standard"){
        map.removeLayer(map.baseLayer);
    }
}

function stopEditing(mapName){
    $.post($SCRIPT_ROOT + '/_stop_editing', {
    }, function(result) {
	getInfo();	
    });
    for(i = 0; i < MAPS.length; i++){
        if(MAPS[i].name == mapName){
            for(j = 0; j < MAPS[i].mapfiles.length; j++){
		if(MAPS[i].mapfiles[j].editor){
                    try{
                        MAPS[i].mapfiles[j].editor.toTextArea();
                        $("#layereditor" + MAPS[i].mapfiles[j].id).remove();
                    }catch(e){}
		}
            }
            break;
        }
    }

    MAP_EDITED = null;
}

function getInfo(){
	$.post($SCRIPT_ROOT + '/_current_info', {
    	}, function(result) {	
	    $('#info').text(result);
	});
}
