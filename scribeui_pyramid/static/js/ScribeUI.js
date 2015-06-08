ScribeUI = new function(){
    this.mapTypes = ["Scribe",  "Standard"];
	this.plugins= [];
    this.workspace = null;
    this.editors = null;
}

jQuery.fn.exists = function(){return this.length>0;}

ScribeUI.addPlugin = function(plugin){
	this.plugins.push(plugin);
	plugin.init();
}

ScribeUI.getTemplatesOfType = function(type){
    $.post($SCRIPT_ROOT + '/_export_map', {
        type: type
    }, function(url) {
        if(templates){
            for(temp in templates){
                $("#newmap-template").append($("<option></option>").val(templates[temp]).text(templates[temp]));
            }
            $('#newmap-template').trigger('chosen:updated');
        }
    });
}
ScribeUI.getTemplates = function(name, type, password, callback){
    var data = {
        name: name,
        type: type
    };

    if(password){
        data['password'] = password;
    }

    $.post($API + '/workspace/maps', data, function(response) {
        if(response.status == 1){
            if(callback){
                callback.call(null, response.maps);
            }
        }
    });
}
// TODO: Maybe the debugging bits should be in their own module?
ScribeUI.deleteGroup = function(groups){
    $.each(groups, function(index, group){
        ScribeUI.workspace.openedMap.removeGroup(group);
    });
}

ScribeUI.unregisterDebug = function(){
    if(ScribeUI.workspace.openedMap.OLMap != null){
        ScribeUI.workspace.openedMap.OLMap.events.unregister('moveend', ScribeUI.workspace.openedMap.OLMap, ScribeUI.Map.onMapMoveEnd);
    }
}

ScribeUI.registerDebug = function(){
    if(ScribeUI.workspace.openedMap.OLMap != null){
        ScribeUI.workspace.openedMap.OLMap.events.on({
            'moveend': ScribeUI.Map.onMapMoveEnd
        });
     }
}

ScribeUI.clearDebug = function(){
    ScribeUI.workspace.openedMap.clearDebug();
}


// TODO: This should really be in a plugin
ScribeUI.cloneMap = function(){
    ScribeUI.UI.manager.git.cloneLogs().val('');

    $("#clonemap-form").dialog({
        autoOpen: false,
        resizable: false,
        modal: true,
        width: 'auto',
        buttons: {
            Clone: function() {
                var name = $("#git-clone-name").val();
                var type = $("#git-clone-type option:selected").val();
                var description = $("#git-clone-description").val();
                var gitURL = $("#git-clone-url").val();
                var gitUser = $("#git-clone-user").val();
                var gitPassword = $("#git-clone-password").val();

                ScribeUI.UI.manager.git.cloneLogs().val('Processing request. This may take a few seconds.');

                ScribeUI.workspace.cloneMap({
                    name: name,
                    type: type,
                    description: description,
                    git_url: gitURL,
                    user: gitUser,
                    password: gitPassword
                });
            },
            Close: function() {
                $(this).dialog("close");
            }
        },
        close: function() {
            $(this).find('input').val('');
            $(this).find('textarea').val('');
        }
    }).dialog("open");
}

ScribeUI.configureMap = function(){
    var map = ScribeUI.workspace.selectedMap;

    if(map){
        $("#git-url").val(map.git_url);
        $("#configure-url").val(map.url);
        $("#configure-description").val(map.description);

        $("#configuremap-form").dialog({
            autoOpen: false,
            resizable: false,
            modal: true,
            width: 'auto',
            buttons: {
                Save: function() {
                    var gitURL = $("#git-url").val();
                    var description = $("#configure-description").val();

                    var config = {
                        git_url: gitURL,
                        description: description
                    }

                    map.configure(config);
                },
                Close: function() {
                    $(this).dialog("close");
                }
            },
            close: function() {
                $(this).find('input').val('');
            }
        }).dialog("open");
    }
}

ScribeUI.commitMap = function(){
    ScribeUI.UI.manager.git.cloneLogs().val('');

    var map = ScribeUI.workspace.selectedMap;

    if (map){
        $("#commitmap-form").dialog({
            autoOpen: false,
            resizable: false,
            modal: true,
            width: 'auto',
            buttons: {
                Commit: function() {
                    var message = $("#git-message").val();
                    var gitUser = $("#git-commit-user").val();
                    var gitPassword = $("#git-commit-password").val();
                    var data = {
                        message: message,
                        user: gitUser,
                        password: gitPassword
                    }

                    ScribeUI.UI.manager.git.cloneLogs().val('Processing request. This may take a few seconds.');

                    map.gitCommit(data);
                },
                Close: function() {
                    $(this).dialog("close");
                }
            },
            close: function() {
                $(this).find('input').val('');
                $(this).find('textarea').val('');
            }
        }).dialog("open");
    }
}

ScribeUI.pullMap = function(){
    ScribeUI.UI.manager.git.pullLogs().val('');

    var map = ScribeUI.workspace.selectedMap;

    if (map){
        $("#pullmap-form").dialog({
            autoOpen: false,
            resizable: false,
            modal: true,
            width: 'auto',
            buttons: {
                "Pull": function() {
                    var method = $('input[name="method"]:radio:checked', '#pullmap-form').val();
                    var gitUser = $("#git-pull-user").val();
                    var gitPassword = $("#git-pull-password").val();

                    var data = {
                        method: method,
                        user: gitUser,
                        password: gitPassword
                    }

					ScribeUI.UI.manager.git.pullLogs().val('Processing request. This may take a few seconds.');

                    map.gitPull(data);
                },
                Close: function() {
                    $(this).dialog("close");
                }
            },
            close: function() {
                $(this).find('textarea').val('');
                $(this).find('input[type="text"]').val('');
                $(this).find('input[type="password"]').val('');
            }
        }).dialog("open");
    }
}

ScribeUI.displayCommitLogs = function(e){
    $("#git-logs").val(e.log);
}

ScribeUI.displayCloneLogs = function(e){
	$("#git-clone-logs").val(e.log);
}


ScribeUI.displayPullLogs = function(e){
	$("#git-pull-logs").val(e.log);
}

$(document).ready(function() {
	if(typeof($SETTINGS) != "undefined"){
		ScribeUI.workspace = new ScribeUI.Workspace($SETTINGS['wsname']);
		ScribeUI.workspace.open();

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
				ScribeUI.workspace.openedMap.saved = false;
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
				ScribeUI.workspace.openedMap.saved = false;
			},
			onGutterClick: function(cm, line, gutter, e){
				var text = cm.getLine(line);
				displayLineEditor(cm, line, text);
			}
		}

		ScribeUI.UI.init();
		var editors = [
			new ScribeUI.Editor("editor", "Groups", {position:"main"}, options),
			new ScribeUI.Editor("map-editor", "Map", {position:"secondary"}, options),
			new ScribeUI.Editor("variable-editor", "Variables", {position:"secondary"}, options),
			new ScribeUI.Editor("scale-editor", "Scales", {position:"secondary"}, options),
			new ScribeUI.Editor("symbol-editor", "Symbols", {position:"secondary"}, options),
			new ScribeUI.Editor("font-editor", "Fonts", {position:"secondary"}, options),
			new ScribeUI.Editor("projection-editor", "Projections", {position:"secondary"}, options),
			new ScribeUI.Editor("readme-editor", "ReadMe", {position:"secondary"}, options)
		]
		ScribeUI.editorManager = new ScribeUI.EditorManager(editors);
        
        //Turn the mapfile output into a codemirror space for error highlighting
        var mapfileOutputOptions = {
            readOnly: true,
            lineNumbers: true
        };
        var mapfileOutputEditor = CodeMirror.fromTextArea(document.getElementById("txt-result"), mapfileOutputOptions);
        $('#txt-result').data('mapfileOutputEditor', mapfileOutputEditor); //Store the editor for later use
	}
});
