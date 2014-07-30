ScribeUI.EditorManager = function(editors){
	this.editors = {};
	if(editors && editors.length > 0){
		for(i in editors)
			this.addEditor(editors[i]);
    }
}
// TODO: Add editor to select
ScribeUI.EditorManager.prototype.addEditor = function(editor){
	var lowercase = editor.name.toLowerCase();
    if(this.editors[lowercase]){
		throw "Editor "+lowercase+" already exists";
	}else{
		this.editors[lowercase] = editor;
	}
	var option = $('<option value="'+lowercase+'">'+editor.name+'</option>');
	ScribeUI.UI.editor.editorSelect().append(option);
    ScribeUI.UI.editor.editorSelect().trigger("chosen:updated");
}
ScribeUI.EditorManager.prototype.get = function(editorId){
	return this.editors[editorId];
}
ScribeUI.Editor = function(id, name, options, CMOptions){
	this.name = name;
	this.id = id;
	this.position = options.position || "secondary";
	this.CMEditor =  CodeMirror.fromTextArea(document.getElementById(id), CMOptions);
}

ScribeUI.Editor.prototype.searchLine = function(needle){
	var haystack = this.CMEditor;
	for(var i=0; i < haystack.lineCount(); i++){
		var line = haystack.getLine(i);
		if(line.indexOf(needle) !== -1){
			lineHandle = haystack.getLineHandle(i);

			//Skip the line if it is commented
			if(lineHandle.styles.indexOf("comment") >= 0)
				continue;

			return lineHandle;
		}
	}
    return null;
}
