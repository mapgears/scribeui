jQuery(function() { $(document).ready(function(){

    //Plugin attributes
    function classify(){
        this.name = "Data Classification Plug-in";
        this.colorChooser = new colorMenu();
    }

    //static enum of syntax styles
    classify.SyntaxEnum = Object.freeze({
        MAPSERVER : 0,
        SCRIBE : 1
    });

    //Get the current map's syntax, return a SyntaxEnum
    classify.getOpenedMapSyntax = function(){
        var syntaxString = ScribeUI.workspace.openedMap.type;
        switch(syntaxString){
            case "Scribe":
                return classify.SyntaxEnum.SCRIBE;
            case "Standard":
                return classify.SyntaxEnum.MAPSERVER;
        }
    };

    //Function ran when the plugin is loaded
    classify.prototype.init = function(){
        //Add a button to the editor toolbar
        ScribeUI.UI.addButton("Classify", "#editor-toolbar",{
            onclick: $.proxy(this.openClassifyPopup, this),
            buttonid: 'btn-classify'
        });
        $('#btn-classify').button('disable');

        //Create the dialog
        $.get("classify/html/classifyMenu.html", null,
            $.proxy(this.handleDialogLoadComplete, this));
    };

    //Function called when the Classify button is pressed
    classify.prototype.openClassifyPopup = function(){
        //Get the local map
        var map = ScribeUI.workspace.openedMap;

        //Add groups to the dropdown
        var dropdownGroups = $('#classify-input-group');
        dropdownGroups.empty();
        var groups = map.groups;
        $.each(groups, function(i, item) {
            dropdownGroups.append($('<option>', {
                value: item.name,
                text: item.name
            }));
        });

        //Switch to selected group and trigger change
        dropdownGroups.val(map.selectedGroup.name).change();

        var dialogDiv = $('#classify-dialog');
        var self = this;

        //Open the dialog
        dialogDiv.dialog({
           autoOpen: false,
           resizable: false,
           width: "auto",
           height: "auto",
           modal: true,
           title: "Classify",
           buttons: {
               Classify: function() {
                   //Get values
                   var errors = "";
                   var dropdownClassType = $('#classify-input-classType').val();
                   var nbClasses = parseInt($('#classify-input-numberClasses').val());
                   var startValue = parseFloat($('#classify-input-startValue').val());
                   var endValue = parseFloat($('#classify-input-endValue').val());
                   var colors = $('.color-input').val().split(',');
                   var field = $('#classify-input-field').val();

                   //Validate values
                   switch(dropdownClassType){
                       case 'Sequential':
                           if(!$.isNumeric(nbClasses)){
                               errors += "Please enter a valid number of classes\n";
                           }
                           if(!$.isNumeric(nbClasses)){
                               errors += "Please enter a valid start value\n";
                           }
                           if(!$.isNumeric(nbClasses)){
                               errors += "Please enter a valid end value\n";
                           }
                           break;
                       case 'Qualitative':
                           break;
                   }

                   if(errors.length > 0){
                       alert(errors);
                   }
                   else {
                       console.log(self.generateClasses(
                           dropdownClassType,
                           nbClasses,
                           startValue,
                           endValue,
                           colors,
                           field,
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
   };

    //Called when a map is opened in ScribeUI
    classify.prototype.onMapOpened = function(){
        $('#btn-classify').button('enable');
    };

    /*  This function is the core of the classify plugin. It generates
     *  classes to add to the map file.
     *  Parameters:
     *      classType:string, Sequential or Qualitative
     *      nbClasses:number, How many classes to generate
     *      startValue:number, Starting value for sequential classes
     *      endValue:number, Final value for sequential classes
     *      colors:array of string, Colors to be used if any
     *      field:string, Field to evaluate
     *      syntax:SyntaxEnum, syntax used for the map
     */
    classify.prototype.generateClasses = function(classType, nbClasses,
            startValue, endValue, colors, field, syntax){
        var output = "";
        var addColors = !(!colors || colors.length == 0 || colors[0].length == 0);

        for(var i = 0; i < nbClasses; i++) {
            output += this.getBaseClass(syntax, addColors);
        }

        //Set expression tags
        var expressions = [];
        switch(classType){
            case "Sequential":
                //Create expressions
                var step = (endValue - startValue) / nbClasses;
                var baseExp = '([FIELD] >= LOWERBOUND AND [FIELD] < UPPERBOUND)'
                for(var i = 0; i < nbClasses; i++){
                    var lowerBound = startValue + (step * i);
                    var upperBound = startValue + (step * (i+1));
                    expressions.push(baseExp
                        .replace(/FIELD/g,field)
                        .replace('LOWERBOUND', lowerBound)
                        .replace('UPPERBOUND', upperBound));
                }
                break;
            case "Qualitative":
                break;
        }
        //Place expressions
        var nbExpressions = expressions.length;
        for(var i = 0; i < nbExpressions; i++){
            output = output.replace('[FLAGEXPRESSION]', expressions[i]);
        }

        //Place colors if defined
        if(addColors){
            var nbColors = colors.length;
            for(var i = 0; i < nbColors; i++){
                output = output.replace('[FLAGCOLOR]', colors[i]);
            }
        }

        return output;
    };

    /*  This function returns a "base" class to be filled with useful
     *  values by the generateClasses function.
     *  Parameters:
     *      syntax:SyntaxEnum, syntax used for the map
     *      addColors:bool, add a style tag for colors or not.
     */
    classify.prototype.getBaseClass = function(syntax, addColors){
        var classStart, classEnd, style;

        switch(syntax){
            case classify.SyntaxEnum.MAPSERVER:
                classStart =  '' +
                    'CLASS\n' +
                    '    EXPRESSION [FLAGEXPRESSION]\n';
                style = '' +
                    '    STYLE\n' +
                    '        COLOR \'[FLAGCOLOR]\'\n' +
                    '    END\n';
                classEnd =  '' +
                    'END\n';
                break;
            case classify.SyntaxEnum.SCRIBE:
                classStart =  '' +
                    'CLASS {\n' +
                    '    EXPRESSION: [FLAGEXPRESSION]\n';
                style = '' +
                    '    STYLE {\n' +
                    '        COLOR: \'[FLAGCOLOR]\'\n' +
                    '    }\n'
                classEnd =  '' +
                    '}\n';
                break;
        }

        if(!addColors){
            style = '';
        }
        return classStart + style + classEnd;
    };

    /*  This function gets any data source in a group using a regex.
     *  Parameters:
     *      group:Group, contains the text to parse for datasources
     */
    classify.prototype.updateDatasources = function(group){
        var datasources = [];
        //Get data formatted with DATA or DATA: in a single line
        var singleLineRegex = /^[\t ]*DATA[ :]*(['"](.*)['"])/gm;
        var match = singleLineRegex.exec(group.content);
        while(match !== null){
            datasources.push(match[2]);
            match = singleLineRegex.exec(group.content);
        }

        //Get data formatted over multiple lines with DATA { ... }
        var multilineRegex = /(^|[ \t]+)DATA[ \t]*{((.|[\n\r])*?)}/gm;
        match = multilineRegex.exec(group.content);
        while(match !== null){
            //get each datasource in a DATA {} block
            var innerDataRegex = /['"](.*)['"]/gm;
            var innerMatch = innerDataRegex.exec(match[2]);
            while(innerMatch !== null){
                datasources.push(innerMatch[1]);
                innerMatch = innerDataRegex.exec(match[2]);
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
    };

    classify.prototype.getDatasourcePath = function(){
        var dropdownDatasources = $('#classify-input-datasource');
        var datasource = dropdownDatasources.val();

        //Get shapefiles path
        var shapepathRegex = /SHAPEPATH[ :]*'(.*)'/;
        var shapepath = shapepathRegex.exec(ScribeUI.workspace.openedMap.map);

        //Get shapefiles path if it exists, else use datasource as is
        if(shapepath && shapepath.length > 0){
            datasource = shapepath[1] + datasource;
        }

        return ScribeUI.workspace.name +
            '/' + ScribeUI.workspace.openedMap.name +
            '/map/' + datasource;
    };

    classify.prototype.updateFields = function(){
        var datasource = this.getDatasourcePath();
        $("#classify-field-info").hide();
        $.ajax({
            url: $API + "/classify/field/getlist",
            type: "POST",
            data: {
                'datasource': datasource
            },
            success: function(result){
                var dropdown = $('#classify-input-field');
                dropdown.empty();

                if(result.errors.length > 0){
                    var fieldInfo = $("#classify-field-info");
                    fieldInfo.show();
                    fieldInfo.text(result.errors);
                }
                else{
                    //Clear the datasource dropdown
                    $.each(result.fields, function(i, item) {
                        dropdown.append($('<option>', {
                            value: item,
                            text: item
                        }));
                    });
                    dropdown.change();
                }
            }
        });
    };

    classify.prototype.getFieldInfo = function(field){
        var datasource = this.getDatasourcePath();

        var loadSpinner = $('#field-load-spinner');
        loadSpinner.show();

        var fieldInfo = $("#classify-field-info");
        fieldInfo.hide();

        $.ajax({
            url: $API + "/classify/field/getinfo",
            type: "POST",
            data: {
                'datasource': datasource,
                'field': field
            },
            success: function(result){
                var fieldType = result.geom_type;

                fieldInfo.show();
                loadSpinner.hide();

                fieldInfo.text("Informations for field '" + field + "'");
                fieldInfo.append("\nField type: " + fieldType);
                fieldInfo.append("\nNumber of values: " + result.nb_values);
                fieldInfo.append("\nUnique values: " + result.unique_values);
                switch (fieldType) {
                    case "String":
                        break;
                    case "Real":
                    case "Integer":
                        fieldInfo.append("\nMinimum: " + result.minimum);
                        fieldInfo.append("\nMaximum: " + result.maximum);
                        break;
                    default:
                        break;
                }

            }
        });
    };

    //Event handlers
    classify.prototype.handleDialogLoadComplete = function(content){

        var self = this;
        var dialogDiv = $('<div id="classify-dialog"/>');
        dialogDiv.append(content);

        //At this point, the dialog is done loading
        $('.main').append(dialogDiv);
        dialogDiv.hide();
        //Setup events
        //Refresh data sources on change
        $('#classify-input-group').change(
            $.proxy(this.handleDropdownGroupsChange, this)
        );

        //Refresh fields on datasource change
        $('#classify-input-datasource').change(
            $.proxy(this.handleDropdownDatasourcesChange, this)
        );

        //Get field info on field change
        $('#classify-input-field').change(
            $.proxy(this.handleDropdownFieldsChange, this)
        );

        //Change displayed option on class type change
        $('#classify-input-classType').change(
            $.proxy(this.handleDropdownClassTypeChange, this)
        );

        //Open color menu on color button press
        $('.classify-buttonColor').click(
            $.proxy(this.handleColorButtonPress, this)
        );
    }

    classify.prototype.handleDropdownGroupsChange = function(event){
        this.updateDatasources(
            ScribeUI.workspace.openedMap.getGroupByName(
                $(event.target).val()));
    }

    classify.prototype.handleDropdownDatasourcesChange = function(event){
        this.updateFields();
    }

    classify.prototype.handleDropdownFieldsChange = function(event){
        var dropdownFields = $(event.target);
        if(dropdownFields.val() !== null){
            this.getFieldInfo(dropdownFields.val());
        }
    }

    classify.prototype.handleDropdownClassTypeChange = function(event){
        var dropdownClassType = $(event.target);
        switch(dropdownClassType.val()){
            case 'Sequential':
                $('#classify-options-sequential').show();
                $('#classify-options-qualitative').hide();
                break;
            case 'Qualitative':
                $('#classify-options-sequential').hide();
                $('#classify-options-qualitative').show();
                break;
        }
    }

    classify.prototype.handleColorButtonPress = function(event){
        this.colorChooser.open(this.handleColorChooserClose);
    }

    classify.prototype.handleColorChooserClose = function(colorRange){
        $('.color-input').val(colorRange);
    }

    //Add the plugin to ScribeUI
    ScribeUI.addPlugin(new classify());
});});
