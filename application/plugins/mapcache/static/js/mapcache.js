jQuery(function() { $(document).ready(function(){
    function mapcache(){
		this.name = "Mapcache Plug-in";
		this.dialogDiv = null;
		this.jobs = [];
	}

	function job(){
		this.map = null;	
		this.id = -1;
	}
	
	mapcache.prototype.init = function(){
		console.log("init");
		//Adding mapcache button to the map actions div
		var button = $('<button id="btn_open_mapcache_dialog" style="width:100%">Mapcache</button>').button();
		button.on('click', $.proxy(this.openDialog, this));
		var div = $('<div></div>').append(button);
		$('#map-actions').append(div);
		
		$('#map-description').bind('DOMSubtreeModified', $.proxy(function(e) { 
			var mapname = $("#map-description .map-title").text();
			if(mapname != null){
				var map = _workspace.getMapByName(mapname);
				this.updateJobListTable(map);
			}
		}, this));
	}
    mapcache.prototype.openDialog = function(){
        var mapname = $("#map-description .map-title").text();
		var map = _workspace.getMapByName(mapname);
		
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
				var mapname = $("#map-description .map-title").text();
				var map = _workspace.getMapByName(mapname);
				this.addJob(map)
			}, this));
			this.dialogDiv.append(startButton);
				

			//Show all jobs button
			var allButton = $('<button id="show-all-mapcache-jobs">Show all jobs</button>').button().click($.proxy(function(){
				var mapname = $("#map-description .map-title").text();
				var map = _workspace.getMapByName(mapname);
				this.updateJobListTable(map, true);
			}, this));
			this.dialogDiv.append(allButton);
		}else{
			this.clearJobDialog();
		}
     	
		this.updateJobListTable(map);		
		this.dialogDiv.dialog("open");
	} 
	//Creates a new job and adds it to the list
	mapcache.prototype.addJob = function(map){
		$.ajax({
			url: "http://localhost/ScribeUI/plugins/mapcache/startjob?map="+map.name+"&ws="+_workspace.name
		}).done(function(data){
			console.log(data);	
		});
		var j = new job();
		j.id = this.jobs.length;
		j.map = map;
		this.jobs.push(j);
		this.updateJobListTable(map);		
	}
	
	//Updates the table displaying the current jobs
	mapcache.prototype.updateJobListTable = function(map, showall){
		var nojobs = true;
		if(typeof(showall)==='undefined') showall = false;
		this.clearJobDialog();
		$('#start-new-mapcache-job-mapname').text(map.name);
		if(this.jobs.length != 0){
			var table = $('<table id="mapcache-jobs-list"><tr>'+
				'<th>ID</th><th>Map</th></tr>');
			for(i in this.jobs){
				if(this.jobs[i].map == map || showall){
					nojobs = false;
					table.append('<tr><td>'+this.jobs[i].id+'</td><td>'+this.jobs[i].map.name+'</td></tr>');
				}
			}
			if(!nojobs) $('#start-new-mapcache-job').after(table);
		}
		if(nojobs){
			$('#start-new-mapcache-job').after('<div id="no-mapcache-jobs">There is no tiling job running now.</div>');
		}
	}
	//Removes the table or empty message, but does not remove the button	
	mapcache.prototype.clearJobDialog = function(){
		$('#no-mapcache-jobs').remove();
		$('#mapcache-jobs-list').remove();
	}
    addPlugin(new mapcache());
})});
