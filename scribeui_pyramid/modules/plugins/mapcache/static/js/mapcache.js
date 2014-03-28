jQuery(function() { $(document).ready(function(){
    function mapcache(){
		this.name = "Mapcache Plug-in";
		this.dialogDiv = null;
		this.mapOpenCallback = null;
		this.optionsDialog = null;
		this.jobs = [];
		this.mapcacheViewerManager = null;
	}

	function job(id, title, map, status){
		this.map = map;	
		this.id = id;
		this.title = title;
		this.status = status;
		
	}
	//Called when the plugin is loaded in the main app
	mapcache.prototype.init = function(){
		//Adding mapcache button to the map actions div
		var button = $('<button id="btn_open_mapcache_dialog" style="width:100%">Mapcache</button>').button();
		button.on('click', $.proxy(this.openDialog, this));
		var div = $('<div></div>').append(button);
		$('#map-actions').append(div);
		
		$('#map-description').bind('DOMSubtreeModified', $.proxy(function(e) { 
			var mapname = this.getMapName();
			if(mapname != null){
				var map = workspace.getMapByName(mapname);
				this.updateJobListTable(map);
			}
		}, this));
		
		setInterval($.proxy(this.poke, this), 30000);	
        this.mapcacheViewerManager = new mapcacheViewerManager(this);
	}
	//Called by core's functions.js
	mapcache.prototype.onMapOpened = function(){
		this.mapcacheViewerManager.onMapOpened();
		if(this.mapOpenCallback) this.mapOpenCallback();
		this.mapOpenCallback = null;
	}
	mapcache.prototype.getMapName = function(){
		var mapname = $("#map-description .map-title").text();
		if(!mapname){
			if(workspace.openedMap == null){
				return;
			}else{
				mapname = workspace.openedMap.name;
			}
		}
		return mapname;
	}
	//Opens the job list dialog
    mapcache.prototype.openDialog = function(){
        var mapname = this.getMapName();
		var map = workspace.getMapByName(mapname);
		
		// Creating the dialog if run for the first time
		if(this.dialogDiv == null){
			this.dialogDiv = $('<div id="mapcache-dialog"></div>')
			this.dialogDiv.hide();
			$('.main').append(this.dialogDiv);
			this.dialogDiv.dialog({
				autoOpen: false,
				resizable: true,
				width: "500px",
				height: "auto",
				modal: false,
				title: "Mapcache job",
				beforeClose: $.proxy(this.closeDialog, this)
			});
			
			//Start new job button
			var startButton = $('<button id="start-new-mapcache-job">Start new tiling job for <span id="start-new-mapcache-job-mapname">'+mapname+'</span></button>').button().click($.proxy(function(){
				var mapname = this.getMapName();
				var map = workspace.getMapByName(mapname);
				//No map opened, we open it
				if(workspace.openedMap == null){ 
					this.mapOpenCallback = function() { $.proxy(this.openOptionsDialog(map), this); };
					openMap();
				//A map is opened and it's not the selected one
				}else if(workspace.openedMap != map){
					// We warn the user if there are unsaved changes
					if(!workspace.openedMap.saved){
						var message = "<p>"+workspace.openedMap.name + " is currently opened and have unsaved changes. Do you wish to continue? <br/>Click the Cancel button to go back and save your changes.</p>";
						var warningDialog = $('<div id="mapcache-warning">'+message+'</div>');
						warningDialog.dialog({
							autoOpen: true,
							resizable: true,
							modal: true,
							title: "Warning",
							buttons: {
								"Continue without saving": $.proxy(function(){
									this.mapOpenCallback = function() { $.proxy(this.openOptionsDialog(map), this); };
									openMap();
									$('#mapcache-warning').dialog("close");
									$('#mapcache-warning').remove();
								}, this),
								Cancel: function(){
									$(this).dialog("close");
									$('#mapcache-warning').remove();
								}
							}
						});
					// If a map is opened, it's not the one selected but there are no unsaved changes, 
					// we open the selected one anyway
					}else{	
						this.mapOpenCallback = function() { $.proxy(this.openOptionsDialog(map), this); };
						openMap();
					}
				// If there is a map opened and it's the right one, we proceed
				}else{
					$.proxy(this.openOptionsDialog(map), this);
				}
				

			}, this));
			this.dialogDiv.append(startButton);
				

			//Show all jobs button
			var allButton = $('<button id="show-all-mapcache-jobs">Show jobs from all maps</button>').button().click($.proxy(function(){
				var mapname = $("#map-description .map-title").text();
				var map = workspace.getMapByName(mapname);
				this.updateJobListTable(map, true);
			}, this));
			this.dialogDiv.append(allButton);
		}else{
			this.clearJobDialog();
		}
     	this.updateJobListTable(map);
		this.getJobs($.proxy(this.updateJobListTable, this, map));		
		this.dialogDiv.dialog("open");
	} 
	//Open the options dialog when clicking on the "Start new tiling job for x"
	mapcache.prototype.openOptionsDialog = function(map){
		var mapExtentButton = $('<button id="mapcache-map-extent">Map Extent</button>').button().click($.proxy(function(){
			$('#mapcache-extent').val(this.getMapExtent());
		}, this));
		var currentExtentButton = $('<button id="mapcache-current-extent">Current Extent</button>').button().click($.proxy(function(){
			$('#mapcache-extent').val(this.getCurrentExtent());
		},this));
		
		this.optionsDialog = $('<div id="mapcache-options-dialog">'+
			'<div class="control-group"><label for="mapcache-title">Title: </label><div class="control"><input id="mapcache-title" type="text"/></div></div>'+
			'<div class="control-group"><label for="mapcache-zoomlevels">Zoom levels: </label><div class="control"><div>GoogleMapsCompatible grid zoom levels</div><div id="mapcache-zoomlevels-error"></div><input id="mapcache-zoomlevels" type="text"/>'+
			'<div id="mapcache-zoomlevels-slider"></div></div>'+	
			'<div class="control-group"><label for="mapcache-metatiles">Metatile Size: </label><div class="control"><div id="mapcache-metatiles-error"></div><input id="mapcache-metatiles" type="text" value="8,8"/></div></div>'+
			'<div class="control-group"><label for="mapcache-extent">Extent: </label><div class="control"><div id="mapcache-extent-error"></div><p><input id="mapcache-extent" type="text" value=""/></div></p></div>'+
			'</div>');
		this.optionsDialog.hide();
		$('.main').append(this.optionsDialog);
		$('#mapcache-extent').after(currentExtentButton);
		$('#mapcache-extent').after(mapExtentButton);
		$('#mapcache-extent').after($('<br/>'));
		
		this.optionsDialog.dialog({
			autoOpen: false,
			resizable: true,
			width: "500px",
			height: "auto",
			modal: true,
			title: "Mapcache job", 
			beforeClose: function(){
				$(this).dialog('destroy').remove();
			}
		});
		
		//Start new job button
		var startButton = $('<button id="launch-mapcache-job">Launch job</button>').button().click($.proxy(function(){
			var jobtitle = $('#mapcache-title').val().trim();
			var zoomLevels = $('#mapcache-zoomlevels').val().trim();
			var metatile = $('#mapcache-metatiles').val().trim();
			var extent = $('#mapcache-extent').val().trim();
			if(this.validateOptions(jobtitle, zoomLevels, metatile, extent)){
				var mapname = this.getMapName();
				var map = workspace.getMapByName(mapname);
				
				$.proxy(this.addJob(map, jobtitle, zoomLevels, metatile, extent), this);
				$(this.optionsDialog).dialog("close");
			}
		}, this));
		var maxScale = -1;
		for(k in workspace.openedMap.OLScales){
			var i = parseInt(k);
			if(i > maxScale) maxScale = i;
		}
		this.optionsDialog.append(startButton);
		$( "#mapcache-zoomlevels-slider" ).slider({
			range: true,
			min: 0,
			max: maxScale,
			values: [0, 7],
			slide: function( event, ui ) {
				$("#mapcache-zoomlevels").val(ui.values[0]+","+ui.values[1]);
				}
			});
		$("#mapcache-zoomlevels").val($("#mapcache-zoomlevels-slider").slider("values", 0)+
			","+$("#mapcache-zoomlevels-slider").slider("values",1));
		this.optionsDialog.dialog("open");
	}
	//Reads the map's extent in the editors['maps']
	mapcache.prototype.getMapExtent = function(){
		var extentStr = "EXTENT ";
		if(workspace.openedMap.type == "Scribe")
			extentStr = "EXTENT:";
		for(var i=0; i<editors['maps'].lineCount(); i++){
			if(editors['maps'].getLine(i).indexOf(extentStr) !== -1){
				l = editors['maps'].getLine(i);
				return l.substr(l.indexOf(extentStr)+extentStr.length,l.length).trim().replace(/ /g,',');
			}
		}
	}
	// Returns the current extent in the map previewer
	mapcache.prototype.getCurrentExtent = function(){
		return workspace.openedMap.OLMap.getExtent();
	}
	mapcache.prototype.validateOptions = function(jobtitle, zoomlevels, metatile, extent){
		valid = true;
		if(!zoomlevels || !zoomlevels.match(/^[0-9]+,[0-9]+$/)){
			$('#mapcache-zoomlevels-error').text('Zoom levels must be of the form: x,x where x is a number');
			valid = false;
		}else{
			$('#mapcache-zoomlevels-error').text('');
		}
		if(!metatile || !metatile.match(/^[0-9]+,[0-9]+$/)){
			$('#mapcache-metatiles-error').text('Metatiles must be of the form: x,x where x is a number');
			valid = false;
		}else{
			$('#mapcache-metatiles-error').text('');
		}
		if(!extent || !extent.match(/^(-?[0-9.]+,){3}-?[0-9.]+$/)){
			$('#mapcache-extent-error').text('Invalid extent. It must be four numbers seperated by spaces or comma.');
			valid = false;
		}else{
			$('#mapcache-extent-error').text('');
		}
		return valid;
	}
	//Creates a new job and adds it to the list
    mapcache.prototype.addJob = function(map, jobtitle, zoomlevels, metatile, extent){
        $.ajax({
            url: $API + "/mapcache/startjob?map="+map.id+
                                            "&title="+jobtitle+
                                            "&zoomlevels="+zoomlevels+
                                            "&metatile="+metatile+
                                            "&extent="+extent,
            context: this,
            dataType: "json"
        }).done(function(data){
            var j = new job(data.job.id, data.job.title, map, data.job.status);
            this.jobs.push(j);
            this.updateJobListTable(map);        
        });
        map.OLMap.mapcacheViewer.updateLayers();
    }
	//Catch the workspace's finished and running jobs and put them in the local queue
	mapcache.prototype.onWorkspaceOpened = function(){
		this.getJobs();
	}
	//Called in regular intervals to update the function list
	// Only pokes the server if the job list dialog is opened, and if there is a job in progress
	mapcache.prototype.poke = function(){
		if(this.jobs.length > 0 && this.dialogDiv != null && this.dialogDiv.dialog("isOpen") == true){
			var poke = false;
			for(i in this.jobs){
				// If there is a job in progress, we poke
				if(this.jobs[i].status == 1){
					poke = true;
					break;
				}
			}
			if(poke){
				this.getJobs();
			}
			
		}
	}
	//Get the job list from the backend
	mapcache.prototype.getJobs = function(callback){
		$.ajax({
			url: $API+"/mapcache/getjobs?ws="+workspace.name,
			context: this,
			dataType: "json"
		}).done(function(data){
			this.jobs = [];
            for(i in data.jobs){
                var j = new job(data.jobs[i].id, data.jobs[i].title, workspace.getMapByName(data.jobs[i].map_name), data.jobs[i].status);
				this.jobs.push(j);
				for(i in this.jobs){
					if($('#jobid'+this.jobs[i].id).length > 0){
						this.updateLine(this.jobs[i]);
					}
				}
			}
			if(typeof(callback) != "undefined"){
				callback();
			}
		}, this);
	}
	//Updates the table displaying the current jobs
	mapcache.prototype.updateJobListTable = function(map, showall){
		var nojobs = true;
		if(typeof(showall)==='undefined') showall = false;
		this.clearJobDialog();
		$('#start-new-mapcache-job-mapname').text(map.name);
		if(this.jobs.length != 0){
			var table = $('<table id="mapcache-jobs-list"><tr>'+
				'<th>ID</th><th>Title</th><th>Map</th><th>Status</th><th>Action</th></tr></table>');
			for(i in this.jobs){
				if(this.jobs[i].map == map || showall){
					nojobs = false;
					var tr = $('<tr id="jobid'+this.jobs[i].id+'"></tr>');
					tr.append('<td>'+this.jobs[i].id+'</td>');
					tr.append('<td>'+this.jobs[i].title+'</td>');
					tr.append('<td>'+this.jobs[i].map.name+'</td>');
					tr.append('<td>'+this.printStatus(this.jobs[i].status)+'</td>');
					var td = $('<td></td>');
					td.append(this.printAction(this.jobs[i]));
					tr.append(td);
					table.append(tr);
				}
			}
			if(!nojobs){
				 $('#start-new-mapcache-job').after(table);
				var refreshLine = $('<p id="mapcache-refresh" style="margin-bottom:10px">Updates every 30s. </p>');
				var refreshLink = $('<a href="#">Refresh now.</a>');
				refreshLink.click($.proxy(this.poke, this));
				refreshLine.append(refreshLink);
				table.after(refreshLine);
			}

		}
		if(nojobs){
			$('#start-new-mapcache-job').after('<div id="no-mapcache-jobs">There is no tiling job running now.</div>');
		}
	}
	// Removes a finished or stopped job
	mapcache.prototype.clearJob = function(j){
		$.ajax({
			url: $API+"/mapcache/clearjob?job="+j.id,
			context: this,
			dataType: "json"
		}).success(function(data){
			for(i in this.jobs){
				if(this.jobs[i].id == j.id){
					$("#jobid"+this.jobs[i].id).remove();
					this.jobs.splice(i, 1);
					//Check if there are elements left in the table:
					if($('#mapcache-jobs-list tr').length == 1){
						this.clearJobDialog();		
						$('#start-new-mapcache-job').after('<div id="no-mapcache-jobs">There is no tiling job running now.</div>');
					}
				}
			}
		}, this);

	}
	//Stops a running job
	mapcache.prototype.stopJob = function(job){
		if($("#mapcache-jobstop-confirmation").length == 0)
			var confirmDialog = $('<div id="mapcache-jobstop-confirmation"><p>Are you sure you want to stop this job? The job will not be recoverable.</p></div>');
		else var confirmDialog = $("#mapcache-jobstop-confirmation");
		confirmDialog.dialog({
			resizable: false,
			height:140,
			modal: true,
			buttons: {
				"Stop job": $.proxy(function() {
					$("#mapcache-jobstop-confirmation").dialog( "close" );
					$.ajax({
						url:  $API+"/mapcache/stopjob?job="+job.id,
						context: this,
						dataType: "json"
					}).success(function(data){
						for(i in this.jobs){
							if(this.jobs[i].id == job.id){
								this.jobs[i].status = 2;
								this.updateLine(this.jobs[i]);
							}
						}	
					});

				}, this),
				Cancel: function() {
					$( this ).dialog( "close" );
				}
			}
		});
	}
	//Call to update the status of a job
	mapcache.prototype.updateLine = function(job){
		var str = $("#jobid"+job.id).html();
		str = str.replace("In progress",this.printStatus(job.status));
		$("#jobid"+job.id).html(str);
		$("#jobid"+job.id+" a").replaceWith(this.printAction(job));
	}
	// Returns the string associated with the status int
	mapcache.prototype.printStatus = function(status){
		switch(status){
			case 0:
				return "Finished";
				break;
			case 1:
				return "In progress";
				break;
			case 2:
				return "Stopped";
				break;
		}
	}
	// Returns a link with the appropriate action (clear or stop) for the job
	// The link also has the appropriate event binded.
	mapcache.prototype.printAction = function(job){
		switch(job.status){
			case 0:
			case 2:
				var link = $('<a href="#">Clear</a>');
				link.click($.proxy(function(){ this.clearJob(job) }, this));
				return link;
				break;
			case 1:
				var link = $('<a href="#">Stop</a>');
				link.click($.proxy(function(){ this.stopJob(job) }, this));
				return link;
				break;
		}
	}
	//Removes the table or empty message, but does not remove the button	
	mapcache.prototype.clearJobDialog = function(){
		$('#no-mapcache-jobs').remove();
		$('#mapcache-jobs-list').remove();
		$('#mapcache-refresh').remove();
	}
    addPlugin(new mapcache());
})});
