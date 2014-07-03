function EditorManager(editors){
	this.editors = [] || editors;
}
EditorManager.prototype.addEditor(editor){
	this.editors.push(editor);
}
EditorManager.prototype.get(editorId){
	return this.editors[editorId];
}
function Editor(id, name, options, CMOptions){
    this.name = name;
    this.id = id;
    this.position = options.position || "secondary";
	this.CMEditor =  CodeMirror.fromTextArea(document.getElementById(id), CMOptions);
}

