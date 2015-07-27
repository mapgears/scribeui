jQuery(function() { $(document).ready(function(){

    //Plugin attributes
    function classify(){
        this.name = "Data Classification Plug-in";
    }

    //static enum of syntax styles
    classify.SyntaxEnum = Object.freeze({
        MAPSERVER : 0,
        SCRIBE : 1
    });

    //Get the current map's syntax, return a SyntaxEnum
    classify.getOpenedMapSyntax = function(){
        syntaxString = ScribeUI.workspace.openedMap.type;
        switch(syntaxString){
            case "Scribe":
                return classify.SyntaxEnum.SCRIBE;
            case "Standard":
                return classify.SyntaxEnum.MAPSERVER;
        }
    }

    //Function ran when the plugin is loaded
    classify.prototype.init = function(){
        //Add a button to the editor toolbar
        ScribeUI.UI.addButton("Classify", "#editor-toolbar",{
            onclick: $.proxy(this.openClassifyPopup, this),
            buttonid: 'btn-classify'
        });
        $('#btn-classify').button('disable');

        //Create the dialog
        var dialogDiv = $('' +
        '<div id="classify-dialog">' +
            '<div class="control-group">' +
                '<label>Group/Layer</label>' +
                '<div class="control">' +
                    '<select id="classify-input-group"/>' +
                '</div>' +
            '</div>' +
            '<div class="control-group">' +
                '<label>Data source</label>' +
                '<div class="control">' +
                    '<select id="classify-input-datasource"/>' +
                '</div>' +
            '</div>' +
            '<div class="control-group">' +
                '<label>Attribute</label>' +
                '<div class="control">' +
                    '<select id="classify-input-attribute"/>' +
                '</div>' +
            '</div>' +
        '</div>');
		dialogDiv.hide();
		$('.main').append(dialogDiv);
    }

    //Function called when the Classify button is pressed
    classify.prototype.openClassifyPopup = function(){
        //Get the local map
        var map = ScribeUI.workspace.openedMap;

        //Add groups to the dropdown
        var dropdown = $('#classify-input-group');
        dropdown.empty();
        var groups = map.groups;
        $.each(groups, function(i, item) {
            dropdown.append($('<option>', {
                value: item.name,
                text: item.name
            }));
        });

        var self = this;

        //Refresh data sources on change
        dropdown.change(function(){
            self.updateDatasources(
                ScribeUI.workspace.openedMap.getGroupByName(dropdown.val()));
        });

        //Switch to selected group and trigger change
        dropdown.val(map.selectedGroup.name).change();

        var dialogDiv = $('#classify-dialog');
        //Open de dialog
        dialogDiv.dialog({
           autoOpen: false,
           resizable: false,
           width: "auto",
           height: "auto",
           modal: true,
           title: "Classify",
           buttons: {
               Classify: function() {
                   //START TMP
                   $.ajax({
                       url: "helloworld",
                       success: function(result){
                           console.log(result);
                       }
                   });
                   //END TMP
                   //Get values
                   var errors = [];
                   var nbClasses = $('#classify-nbclasses').val();

                   //Validate values
                   if(!$.isNumeric(nbClasses)){
                       errors.push("Please enter a valid number of classes\n");
                   }

                   if(errors.length > 0){
                       alert(errors);
                   }
                   else {
                       console.log(self.generateClasses(
                           nbClasses,
                           classify.getOpenedMapSyntax()
                       ));
                       $(this).dialog("close");
                   }
               },
               Close: function() {
                   $(this).dialog("close");
               }
           },
           close: function() {}
       }).dialog("open");
    }

    //Called when a map is opened in ScribeUI
    classify.prototype.onMapOpened = function(){
        $('#btn-classify').button('enable');
    }

    /*  This function is the core of the classify plugin. It generates
     *  classes to add to the map file.
     *  Parameters:
     *      nbClasses:int, How many classes to generate
     *      syntax:SyntaxEnum, syntax used for the map
     */
    classify.prototype.generateClasses = function(nbClasses, syntax){
        var output = "";

        for(var i = 0; i < nbClasses; i++) {
            output += this.getBaseClass(syntax);
        }

        return output;
    }

    /*  This function returns a "base" class to be filled with useful
     *  values by the generateClasses function.
     *  Parameters:
     *      syntax:SyntaxEnum, syntax used for the map
     */
    classify.prototype.getBaseClass = function(syntax){
        switch(syntax){
            case classify.SyntaxEnum.MAPSERVER:
                return '' +
                    'CLASS\n' +
                    '    EXPRESSION [FLAGEXPRESSION]\n' +
                    '    STYLE\n' +
                    '        COLOR [FLAGCOLOR]\n' +
                    '    END\n' +
                    'END\n';
            case classify.SyntaxEnum.SCRIBE:
                return '' +
                    'CLASS {\n' +
                    '    EXPRESSION: [FLAGEXPRESSION]\n' +
                    '    STYLE {\n' +
                    '        COLOR: [FLAGCOLOR]\n' +
                    '    }\n' +
                    '}\n';
        }
    }

    /*  This function gets any data source in a group using a regex.
     *  Parameters:
     *      group:Group, contains the text to parse for datasources
     */
    classify.prototype.updateDatasources = function(group){
        var datasources = [];
        //Get data formatted with DATA or DATA: in a single line
        var singleLineRegex = /^[\t ]*DATA[ :]*(['"](.*)['"])/gm;
        var match = singleLineRegex.exec(group.content);
        while(match != null){
            datasources.push(match[2]);
            match = singleLineRegex.exec(group.content);
        }

        //Get data formatted over multiple lines with DATA { ... }
        var multilineRegex = /(^|[ \t]+)DATA[ \t]*{((.|[\n\r])*?)}/gm;
        var match = multilineRegex.exec(group.content);
        while(match != null){
            //get each datasource in a DATA {} block
            var innerDataRegex = /['"](.*)['"]/gm;
            var innerMatch = innerDataRegex.exec(match[2]);
            while(innerMatch != null){
                datasources.push(innerMatch[1]);
                var innerMatch = innerDataRegex.exec(match[2]);
            }
            match = multilineRegex.exec(group.content);
        }

        datasources = $.unique(datasources); //Remove duplicates

        //Clear the datasource dropdown
        var dropdown = $('#classify-input-datasource');
        dropdown.empty();

        //Add datasources to the dropdown
        $.each(datasources, function(i, item) {
            dropdown.append($('<option>', {
                value: item,
                text: item
            }));
        });

        dropdown.change();
    }

    //Add the plugin to ScribeUI
    ScribeUI.addPlugin(new classify());
})});
