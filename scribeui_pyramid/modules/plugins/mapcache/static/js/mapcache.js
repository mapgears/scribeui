jQuery(function() { $(document).ready(function(){
    function mapcache(){
        this.name = "MapCache Plug-in";
        this.dialogDiv = null;
        this.createDatabaseConfigDiv = null;
        this.mapOpenCallback = null;
        this.optionsDialog = null;
        this.jobs = [];
    }

    function job(id, title, map, status){
        this.map = map;    
        this.id = id;
        this.title = title;
        this.status = status;
        
    }
    //Called when the plugin is loaded in the main app
    mapcache.prototype.init = function(){
    	this.getJobs();
        this.getDatabaseConfigs();

        //Adding mapcache button to the map actions div
        var button = $('<button id="btn_open_mapcache_dialog" style="width:100%">MapCache</button>').button();
        button.on('click', $.proxy(this.openDialog, this));
        var div = $('<div></div>').append(button);
        $('#map-actions').append(div);
        
        $('#map-description').bind('DOMSubtreeModified', $.proxy(function(e) { 
            var map = workspace.selectedMap;
            if(map != null){
                this.updateJobListTable(map);
            }
        }, this));

        setInterval($.proxy(this.poke, this), 30000);    
    }
    //Called by core's functions.js
    mapcache.prototype.onMapOpened = function(){
        if(this.mapOpenCallback) this.mapOpenCallback();
        this.mapOpenCallback = null;
    }
    //Opens the job list dialog
    mapcache.prototype.openDialog = function(){
        // Creating the dialog if run for the first time
        var map = workspace.selectedMap
        
        // Creating the dialog if run for the first time
        if(this.dialogDiv == null){
            this.dialogDiv = $('<div id="mapcache-dialog" class="scribe-dialog"></div>')
            this.dialogDiv.hide();
            $('.main').append(this.dialogDiv);
            this.dialogDiv.dialog({
                autoOpen: false,
                resizable: true,
                modal: false,
                title: "MapCache Job",
                beforeClose: $.proxy(this.closeDialog, this)
            });

            //Start new job button
            var startButton = $('<button id="start-new-mapcache-job">Start new tiling job</button>').button().click($.proxy(function(){
            var map = workspace.selectedMap;
            //No map opened, we open it
            if(workspace.openedMap == null){ 
                //this.mapOpenCallback = function() { $.proxy(this.openOptionsDialog(map), this); };
                this.mapOpenCallback = function() { $.proxy(this.getMapData(map), this); };
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
                                //this.mapOpenCallback = function() { $.proxy(this.openOptionsDialog(map), this); };
                                this.mapOpenCallback = function() { $.proxy(this.getMapData(map), this); };
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
                    //this.mapOpenCallback = function() { $.proxy(this.openOptionsDialog(map), this); };
                    this.mapOpenCallback = function() { $.proxy(this.getMapData(map), this); };
                    openMap();
                }
                // If there is a map opened and it's the right one, we proceed
                }else{
                    //$.proxy(this.openOptionsDialog(map), this);
                    $.proxy(this.getMapData(map), this);
                }

            }, this));
            this.dialogDiv.append(startButton);
                
            //Show all jobs button
            var allButton = $('<button id="show-all-mapcache-jobs">Show jobs from all maps</button>').button().click($.proxy(function(){
                var map = workspace.selectedMap;
                this.updateJobListTable(map, true);
            }, this));
            this.dialogDiv.append(allButton);
        }else{
            this.clearJobDialog();
        }
         
        this.updateJobListTable(map);        
        this.dialogDiv.dialog("open");
    } 
    //Open the options dialog when clicking on the "Start new tiling job for x"
    mapcache.prototype.openOptionsDialog = function(map){
        var self = this;

        var grids = '';
        $.each(map.grids, function(index, grid){
            grids += '<option value="' + grid + '">' + grid + '</option>';
        });

        var radios = '' +
            '<div class="control-group horizontal">' +
                '<label>Map Extent</label>' +
                '<div class="control">' +
                    '<input type="radio" name="radio-extent" value="map" selected>' +
                '</div>' +
                '<label>Current Extent</label>' +
                '<div class="control">' +
                    '<input type="radio" name="radio-extent" value="current">' +
                '</div>' +
                '<label>Shapefile</label>' +
                '<div class="control">' +
                    '<input type="radio" name="radio-extent" value="shapefile">' +
                '</div>' +
                '<label>Database</label>' +
                '<div class="control">' +
                    '<input type="radio" name="radio-extent" value="database">' +
                '</div>' +
            '</div>';

        var databaseConfigs= '<option></option>';
        $.each(workspace.databaseConfigs, function(index, config){
            databaseConfigs += '<option value="' + config.name + '">' + config.name + '</option>';
        });

        this.optionsDialog = $('<div id="mapcache-options-dialog" class="scribe-dialog">'+
            '<div class="control-group"><label for="mapcache-title">Title</label><div class="control"><input id="mapcache-title" type="text"/></div></div>'+
            '<div class="control-group"><label for="mapcache-zoomlevels">Zoom levels</label><div class="control"><input id="mapcache-zoomlevels" type="text"/>'+
            '<div id="mapcache-zoomlevels-slider"></div><div id="mapcache-zoomlevels-error"></div></div></div>'+    
            '<div class="control-group"><label for="mapcache-metatiles">Metatile Size</label><div class="control"><input id="mapcache-metatiles" type="text" value="8,8"/></div><div id="mapcache-metatiles-error"></div></div>'+
            '<div class="control-group"><label for="mapcache-grid">Grid</label><div class="control">' +
            '<select id="mapcache-grid">' + 
            grids +
            '</select>' +
            '</div><div id="mapcache-grid-error"></div></div>'+
            radios + 
            '<div style="display:none" id="connection-extent-container">' +
                '<div id="extent-database-config" class="control-group horizontal">' +
                '<div class="control">' +
                '<select>' + 
                databaseConfigs +
                '</select>' +
                '</div>' +
                '<button id="extent-new-database-config" class="btn-group-first">New</button>' +
                '<button id="extent-delete-database-config" class="btn-group-middle">Delete</button>' +
                '<button id="extent-save-database-config" class="btn-group-last">Save</button>' +
                '</div>' +
                '<div class="control-group horizontal"><label for="extent-database-type">Database type</label><div class="control"><input id="extent-database-type" type="text" value="PostGIS" readonly/></div>' +
                '<label for="extent-host">Host</label><div class="control"><input id="extent-host" type="text" value=""/></div></div>' +
                '<div class="control-group horizontal"><label for="extent-port">Port</label><div class="control"><input id="extent-port" type="text" value="5432"/></div>' +
                '<label for="extent-name">Name</label><div class="control"><input id="extent-name" type="text" value=""/></div></div>' +
                '<div class="control-group horizontal"><label for="extent-user">User</label><div class="control"><input id="extent-user" type="text" value=""/></div>' +
                '<label for="extent-password">Password</label><div class="control"><input id="extent-password" type="password" value=""/></div></div>' +
                '<div class="control-group"><label for="extent-query">Query</label><div class="control"><textarea id="extent-query" type="text" value="" class="long"/></textarea></div></div>' +
            '</div>' +
            '<div class="control-group" id="mapcache-extent-container"><label for="mapcache-extent"></label><div class="control"><div id="mapcache-extent-error"></div>' +
            '<input id="mapcache-extent" type="text" value="" class="long"/>' +
            '<div id="shapefile-extent" style="display:none"></div>' + 
            '</div></div>'+
            '</div>');
        this.optionsDialog.hide();
        $('.main').append(this.optionsDialog);

        $('#mapcache-options-dialog select').chosen();
        $('#extent-database-config button').button();

        $('#extent-new-database-config').on('click', function(){
            self.openDatabaseConfigDialog();
        });

        $('#extent-delete-database-config').on('click', function(){
            self.deleteDatabaseConfig();
        });

        $('#extent-save-database-config').on('click', function(){
            self.saveDatabaseConfig();
        });

        $('#extent-database-config select').on('change', function(){
            var config = self.getDatabaseConfigByName($(this).find('option:selected').val());
            if(config){
                self.setDatabaseConfig(config);    
            }
        });

        var elf = $('#shapefile-extent').elfinder({
        	url: '/cgi-bin/elfinder-python/connector-' + workspace.name + '-' + workspace.selectedMap.name + '.py',
            transport : new elFinderSupportVer1(),
            cssClass: 'shapefile-extent-manager',
            resizable: false,
            defaultView: 'list',
            width: 540,
            height: 200,
            commands: ['reload', 'rm','sort', 'upload', 'extract', 'view'],
            handlers: {
                select: function(event, elfinderInstance){
                    var selected = event.data.selected;

                    if(selected.length > 0){
                        $('#mapcache-extent').val(elfinderInstance.file(selected[0]).url);    
                    }
                }
            }
        }).elfinder('instance');

        $('input[type="radio"][value="map"]').on('click', $.proxy(function(){
            $('#shapefile-extent').hide();
            $('#connection-extent-container').hide();
            $('#connection-extent-container').find('input, textarea').prop('disabled', true);
            
            $('#mapcache-extent-container').show();
            $('#mapcache-extent').val(this.getMapExtent());
        },this)).trigger('click');

        $('input[type="radio"][value="current"]').on('click', $.proxy(function(){
            $('#shapefile-extent').hide();
            $('#connection-extent-container').hide();
            $('#connection-extent-container').find('input, textarea').prop('disabled', true);
            
            $('#mapcache-extent-container').show();
            $('#mapcache-extent').val(this.getCurrentExtent());
        }, this));

        $('input[type="radio"][value="shapefile"]').on('click', $.proxy(function(){
            $('#connection-extent-container').hide();
            $('#connection-extent-container').find('input, textarea').prop('disabled', true);

            $('#mapcache-extent-container').show();
            $('#mapcache-extent').val(null);
            $('#shapefile-extent').show();
        }, this));

        $('input[type="radio"][value="database"]').on('click', $.proxy(function(){
            $('#shapefile-extent').hide();
            $('#mapcache-extent-container').hide();
            $('#mapcache-extent').val(null);

            $('#connection-extent-container').find('input, textarea').prop('disabled', false);
            $('#connection-extent-container').show();
        }, this));
        
        this.optionsDialog.dialog({
            autoOpen: false,
            resizable: true,
            modal: true,
            title: "MapCache", 
            beforeClose: function(){
                $(this).dialog('destroy').remove();
            }
        });
        
        //Start new job button
        var startButton = $('<button id="launch-mapcache-job">Launch job</button>').button().click($.proxy(function(){
            var data = {
                map: workspace.openedMap.id,
                title: $('#mapcache-title').val(),
                zoomlevels: $('#mapcache-zoomlevels').val(),
                metatile: $('#mapcache-metatiles').val(),
                grid: $('#mapcache-grid option:selected').val()
            }

            var radio = $('#mapcache-options-dialog input[name="radio-extent"]:radio:checked');
            if(radio.val() == 'database'){
                data['type'] = $('#extent-database-type').val();
                data['dbhost'] = $('#extent-host').val();
                data['dbport'] = $('#extent-port').val();
                data['dbname'] = $('#extent-name').val();
                data['dbuser'] = $('#extent-user').val();
                data['dbpassword'] = $('#extent-password').val();
                data['dbquery'] = $('#extent-query').val();
            } else{
                data['type'] = 'string';
                data['extent'] = $('#mapcache-extent').val();    
            }
            
            if(this.validateOptions(data)){
                $.proxy(this.addJob(data), this);
            }
        }, this));
        var minScale = 999;
        var maxScale = -1;
        for(k in workspace.openedMap.OLScales){
            var i = parseInt(k);
            if(i < minScale) minScale = i;
            if(i > maxScale) maxScale = i;
        }
        this.optionsDialog.append(startButton);
        $( "#mapcache-zoomlevels-slider" ).slider({
            range: true,
            min: minScale,
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
    mapcache.prototype.validateOptions = function(options){
        //TODO: AJOUTER UNE VALIDATION SUR L'EXTENT QUI TIENT COMPTE DES DIFFÉRENTS TYPES D'EXTENT
        valid = true;
        if(!options['zoomlevels'] || !options['zoomlevels'].match(/^[0-9]+,[0-9]+$/)){
            $('#mapcache-zoomlevels-error').text('Zoom levels must be of the form: x,x where x is a number');
            valid = false;
        }else{
            $('#mapcache-zoomlevels-error').text('');
        }

        if(!options['metatile'] || !options['metatile'].match(/^[0-9]+,[0-9]+$/)){
            $('#mapcache-metatiles-error').text('Metatiles must be of the form: x,x where x is a number');
            valid = false;
        }else{
            $('#mapcache-metatiles-error').text('');
        }

        /*
        if(!options['extent'] || !options['extent'].match(/^(-?[0-9.]+,){3}-?[0-9.]+$/)){
            $('#mapcache-extent-error').text('Invalid extent. It must be four numbers seperated by spaces or comma.');
            valid = false;
        }else{
            $('#mapcache-extent-error').text('');
        }
        */
        return valid;
    }
    //Creates a new job and adds it to the list
    mapcache.prototype.addJob = function(data){
        var self = this;

        $.post($API + "/mapcache/startjob", data, 
            function(response) {
                if(response.status == 1){
                    var map = workspace.getMapByID(response.job.map_id);
                    var j = new job(response.job.id, response.job.title, map, response.job.status);
                    self.jobs.push(j);
                    self.updateJobListTable(map);
                }
            }
        );
    }
    //Called in regular intervals to update the function list
    // Only pokes the server if the job list dialog is opened, and if there is a job in progress
    mapcache.prototype.poke = function(){
        if(this.jobs.length > 0 && this.dialogDiv && this.dialogDiv.dialog("isOpen") == true){
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
            for(i in this.jobs){
                if($('#jobid'+this.jobs[i].id).length > 0){
                    this.updateLine(this.jobs[i]);
                }
            }
        }
    }
    //Get the job list from the backend
    mapcache.prototype.getJobs = function(callback){
        $.ajax({
            url: $API + "/mapcache/getjobs?ws="+workspace.name,
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
        //$('#start-new-mapcache-job-mapname').text(map.name);
        this.dialogDiv.dialog('option', 'title', 'MapCache - ' + map.name);
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

    mapcache.prototype.openDatabaseConfigDialog = function(config){
        if(this.createDatabaseConfigDiv == null){
            this.createDatabaseConfigDiv = $('' +
            '<div id="create-database-config-form" title="New config" style="display:none" class="scribe-dialog">' +
                '<form>' +
                    '<div class="control-group">' +
                        '<label for="database-config-name">Name</label>' +
                        '<div class="control">' +
                            '<input type="text" name="name"/>' +
                        '</div>' +
                    '</div>' +
                '</form>' +
            '</div>');

            this.createDatabaseConfigDiv.hide();
            $('main').append(this.createDatabaseConfigDiv);

            this.createDatabaseConfigDiv.dialog({
                autoOpen: false,
                resizable: false,
                modal: false,
                buttons: {
                    "Create": function() {
                        var name = $(this).find('input[name="name"]').val();
                        if(name && name != ''){
                            //TODO` VALIDER QU'IL N'EXISTE PAS DE CONFIG AVEC LE MÊME NOM DANS LE WORKSPACE

                            var option = $('<option>')
                                .val(name)
                                .text(name)
                                .prop('selected', true);

                            $('#extent-database-config select').append(option).trigger('chosen:updated');
                            $(this).dialog('close');    
                        }
                    },
                    Cancel: function() {
                        $(this).dialog("close");
                    }
                },
                close: function() {
                    $(this).find('input').val(null);
                }
            }).dialog("open");
        } else{
            this.createDatabaseConfigDiv.dialog('open');    
        }
    
    }

    mapcache.prototype.saveDatabaseConfig = function(){
        var config = {
            name: $('#extent-database-config select option:selected').val(),
            ws: workspace.name,
            dbtype: $('#extent-database-type').val(),
            dbhost: $('#extent-host').val(),
            dbport: $('#extent-port').val(),
            dbname: $('#extent-name').val(),
            dbuser: $('#extent-user').val(),
            dbquery: $('#extent-query').val()
        };
        
        $.post($API + "/mapcache/database/config/save", config, 
            function(response) {
                if(response.status == 1){
                    workspace.databaseConfigs.push(config);
                }
            }
        );
    }

    mapcache.prototype.getDatabaseConfigByName = function(name){
        var config = null;
        if(workspace.databaseConfigs){
            for(var i = 0; i < workspace.databaseConfigs.length; i++){
                if(workspace.databaseConfigs[i]['name'] == name){
                    config = workspace.databaseConfigs[i];
                    break
                }
            }
        }

        return config;
    }

    mapcache.prototype.getDatabaseConfigIndexByName = function(name){
        var index = null;
        if(workspace.databaseConfigs){
            for(var i = 0; i < workspace.databaseConfigs.length; i++){
                if(workspace.databaseConfigs[i]['name'] == name){
                    index = i;
                    break
                }
            }
        }

        return index;
    }

    mapcache.prototype.removeDatabaseConfig = function(name){
        var index = this.getDatabaseConfigIndexByName(name);
        if(index !== null){
            workspace.databaseConfigs.splice(index, 1);    
        }
    }

    mapcache.prototype.setDatabaseConfig = function(config){
        $('#extent-database-type').val(config.dbtype);
        $('#extent-host').val(config.dbhost);
        $('#extent-port').val(config.dbport);
        $('#extent-name').val(config.dbname);
        $('#extent-user').val(config.dbuser);
        $('#extent-query').val(config.dbquery);
    }

    mapcache.prototype.getDatabaseConfigs = function(){
        var data = {
            ws: workspace.name
        };

        $.get($API + "/workspaces/mapcache/database/config/get", data, 
            function(response) {
                if(response.status == 1){
                    workspace.databaseConfigs = response.configs;
                }
            }
        );
    }

    mapcache.prototype.deleteDatabaseConfig = function(){
        var self = this;
        var name = $('#extent-database-config select option:selected').val();
        var data = {
            ws: workspace.name,
            name: name
        };
        
        $.post($API + "/mapcache/database/config/delete", data, 
            function(response) {
                if(response.status == 1){
                    $('#extent-database-config select').find('option[value="' + name + '"]').remove();
                    $('#extent-database-config select').trigger('chosen:updated');
                    $('#extent-database-type').val('PostGIS');
                    $('#extent-host').val(null);
                    $('#extent-port').val(5432);
                    $('#extent-name').val(null);
                    $('#extent-user').val(null);
                    $('#extent-password').val(null);
                    $('#extent-query').val(null);

                    self.removeDatabaseConfig(name);
                }
            }
        );
    }

    mapcache.prototype.getMapData = function(map){
        var self = this;
        var data = {
            map: workspace.openedMap.id
        };
        
        $.get($API + "/mapcache/grids/get", data, 
            function(response) {
                if(response.status == 1){
                    map['grids'] = response.grids;
                    $.proxy(self.openOptionsDialog(map), self);
                }
            }
        );
    }

    addPlugin(new mapcache());

})});
