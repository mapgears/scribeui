jQuery(function() { $(document).ready(function() {

    //Plugin attributes
    function classify() {
        this.name = "Data Classification Plug-in";
        this.colorChooser = new colorMenu();

        //A few variables to save locally
        this.classType = "";
        this.nbClasses = 0;
        this.colors = [];
        this.field = "";
        this.mode = "";
        this.startValue = 0;
        this.endValue = 0;
        this.values = [];
        this.fieldType = "";
    }

    //static enum of syntax styles
    classify.SyntaxEnum = Object.freeze({
        MAPSERVER: 0,
        SCRIBE: 1
    });

    //Get the current map's syntax, return a SyntaxEnum
    classify.getOpenedMapSyntax = function() {
        var syntaxString = ScribeUI.workspace.openedMap.type;
        switch(syntaxString) {
            case "Scribe":
                return classify.SyntaxEnum.SCRIBE;
            case "Standard":
                return classify.SyntaxEnum.MAPSERVER;
        }
    };

    //Function ran when the plugin is loaded
    classify.prototype.init = function() {
        //Add a button to the editor toolbar
        ScribeUI.UI.addButton("Classify",
            "#editor-toolbar", {
                onclick: $.proxy(this.openClassifyPopup, this),
                buttonid: 'btn-classify'
            });
        $('#btn-classify').button('disable');

        //Create the dialog
        $.get("classify/html/classifyMenu.html", null,
            $.proxy(this.handleDialogLoadComplete, this));
    };

    //Function called when the Classify button is pressed
    classify.prototype.openClassifyPopup = function() {
        //Get the local map
        var map = ScribeUI.workspace.openedMap;
        this.syntax = classify.getOpenedMapSyntax();

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

        //Open the dialog
        dialogDiv.dialog({
            autoOpen: false,
            resizable: false,
            width: "auto",
            height: "auto",
            modal: true,
            title: "Classify",
            buttons: {
                Classify: $.proxy(this.handleClassifyButtonClick, this),
                Cancel: function() {
                    $(this).dialog("close");
                }
            },
            close: function() {}
        }).dialog("open");
    };

    //Called when a map is opened in ScribeUI
    classify.prototype.onMapOpened = function() {
        $('#btn-classify').button('enable');
    };

    /*  This function is the core of the classify plugin. It generates
     *  classes to add to the map file.
     */
    classify.prototype.generateClasses = function() {
        var classes = [];
        var nbClasses = 0;
        switch(this.classType) {
            case "Sequential":
                nbClasses = this.nbClasses;
                break;
            case "Qualitative":
                nbClasses = this.values.length;
                break;
        }

        for(var i = 0; i < nbClasses; i++) {
            //Declare vars to be used;
            var color = null;
            var lowerBound = null;
            var upperBound = null;
            var value = null;
            var expression = null;

            //Get color
            if(this.colors[i]) {
                color = this.colors[i];
            } else {
                color = null;
            }

            switch(this.classType) {
                case "Sequential":
                    var bounds = this.generateBounds(
                        this.mode, this.nbClasses, i,
                        this.startValue, this.endValue
                    );
                    lowerBound = bounds[0];
                    upperBound = bounds[1];
                    expression = this.generateSequentialExpression(
                        this.field, lowerBound, upperBound);
                    break;
                case "Qualitative":
                    value = this.values[i];
                    expression = this.generateQualitativeExpression(
                        this.field, value);
                    break;
            }


            //Create the class
            var tmpClass = {
                "color": color,
                "lowerBound": lowerBound,
                "upperBound": upperBound,
                "value": value,
                "expression": expression
            };

            //Add it to the classes array
            classes.push(tmpClass);
        }
        this.displayClasses(classes, this.classType);
        return classes;
    };


    /*  This function generates class bounds using different techniques
     *  Parameters:
     *      mode:string, type of classes to generate
     *      nbClasses:number, number of classes in total
     *      classIndex:number, the index of the current class to generate
     *      min:number, the minimum value
     *      max:number, the maximum value
     */
    classify.prototype.generateBounds = function(
            mode, nbClasses, classIndex, min, max) {

        var bounds = [null, null];
        switch(mode) {
            case "Equal intervals":
                var step = (max - min) / nbClasses;
                bounds[0] = min + (step * classIndex);
                bounds[1] = min + (step * (classIndex + 1));
                break;
        }
        return bounds;
    };


    /*  This function generates an expression tag for a sequential class
     *  Parameters:
     *      field:string, the field to evaluate
     *      lowerBound:number,
     *      upperBound:number
     */
    classify.prototype.generateSequentialExpression =
            function(field, lowerBound, upperBound) {

        var baseExp = '([FIELD] >= LOWERBOUND AND [FIELD] <= UPPERBOUND)'
            .replace(/FIELD/g, field)
            .replace('LOWERBOUND', lowerBound)
            .replace('UPPERBOUND', upperBound);

        return baseExp;
    };


    /*  This function generates an expression tag for a qualitative class
     *  Parameters:
     *      field:string, the field to evaluate
     *      value:string, the value to match
     */
    classify.prototype.generateQualitativeExpression =
            function(field, value) {

        if(this.fieldType.toLowerCase() == "string") {
            var baseExp = '(\'[FIELD]\' = \'VALUE\')';
        } else {
            var baseExp = '([FIELD] = VALUE)';
        }

        baseExp = baseExp.replace('FIELD', field)
        baseExp = baseExp.replace('VALUE', value);

        return baseExp;
    };


    /*  This function generates the text to insert into the map file
     *  Parameters:
     *      classes:array
     */
    classify.prototype.generateText = function(classes) {
        var nbClasses = classes.length;
        var output = "";
        for(var i = 0; i < nbClasses; i++) {
            //Get the base class, split in three sections
            var baseClass = this.getBaseClass(this.syntax);
            var classText = "";

            if(classes[i].color) {
                //Replace color flag
                baseClass['style'] = baseClass['style'].replace(
                    '[FLAGCOLOR]', classes[i].color
                );

                //Create text for this class
                classText =
                    baseClass['start'] +
                    baseClass['style'] +
                    baseClass['end'];
            } else {
                //Create text for this class
                classText =
                    baseClass['start'] +
                    baseClass['end'];
            }

            //Replace expression flag
            classText = classText.replace(
                '[FLAGEXPRESSION]', classes[i].expression);
            output += classText;
        }

        return output;
    };

    /*  Insert the classes text into the correct group
     *  Parameters:
     *      text:string, text to insert
     *      group:Group, group to insert the text in
     *      datasource:string, after which datasource to insert the text
     */
    classify.prototype.insertText = function(text, group, datasource) {
        //Get group content
        var groupLines = group.content.split('\n');

        //Find the datasource
        var nbLines = groupLines.length;
        var lineIndex = -1;
        for(var i = 0; i < nbLines && lineIndex == -1; i++) {
            var index = groupLines[i].indexOf(datasource);
            if(index != -1){
                lineIndex = i;
            }
        }

        var indent = '';
        var line = groupLines[lineIndex];
        var dataLine = '';
        var insertPosition;

        //Find where to insert the data
        if(line.toUpperCase().indexOf('DATA') != -1) {
            //Data located on a single line
            dataLine = line;
            insertPosition = lineIndex;
        } else {
            //Data located in a { ... } block
            //Get data line
            for(var i = lineIndex; i >= 0 && !dataLine; i--) {
                if(groupLines[i].toUpperCase().indexOf('DATA') != -1) {
                    dataLine = groupLines[i];
                }
            }
            //Find where to insert it
            for(var i = lineIndex; i < nbLines && !insertPosition; i++) {
                if(groupLines[i].indexOf('}') != -1) {
                    insertPosition = i;
                }
            }
        }

        //Get indentation
        var indentRegex = /(\s*)/;
        indent = indentRegex.exec(dataLine)[0];

        //Rebuild group
        var output = ''
        for(var i = 0; i < nbLines; i++) {
            output += groupLines[i] + '\n';
            if(i == insertPosition){
                var textLines = text.split('\n');
                var nbTextLines = textLines.length;
                for(var j = 0; j < nbTextLines; j++) {
                    output += indent + textLines[j] + '\n';
                }
            }
        }

        //Open the interface at the right place
        ScribeUI.UI.openSecondaryPanel(ScribeUI.editorManager.get('groups'));
        ScribeUI.UI.editor.groupSelect().val(group.name).trigger('change');
        ScribeUI.UI.editor.groupSelect().trigger('chosen:updated');

        //Set the value
        var editor = ScribeUI.editorManager.get('groups').CMEditor;
        editor.setValue(output);

        /* Scroll to taken from
        http://codemirror.977696.n3.nabble.com/Scroll-to-line-td4028275.html
        */
        var h = editor.getScrollInfo().clientHeight;
        var coords = editor.charCoords({line: insertPosition, ch: 0}, "local");
        editor.scrollTo(null, (coords.top + coords.bottom - h) / 2);

        //Save the changes
        ScribeUI.workspace.selectedMap.save();
    };


    /*  This function returns a "base" class to be filled with useful
     *  values by the generateClasses function.
     *  Parameters:
     *      syntax:SyntaxEnum, syntax used for the map
     *  Returns: Array of 3 strings:
     *      start: Start of the class, until the style section
     *      style: Style section, sent seperatly to allow not using it
     *      end: End of the class
     */
    classify.prototype.getBaseClass = function(syntax) {
        var classStart, classEnd, style;

        switch(syntax) {
            case classify.SyntaxEnum.MAPSERVER:
                classStart = '' +
                    'CLASS\n' +
                    '    EXPRESSION [FLAGEXPRESSION]\n';
                style = '' +
                    '    STYLE\n' +
                    '        COLOR \'[FLAGCOLOR]\'\n' +
                    '    END\n';
                classEnd = '' +
                    'END\n';
                break;
            case classify.SyntaxEnum.SCRIBE:
                classStart = '' +
                    'CLASS {\n' +
                    '    EXPRESSION: [FLAGEXPRESSION]\n';
                style = '' +
                    '    STYLE {\n' +
                    '        COLOR: \'[FLAGCOLOR]\'\n' +
                    '    }\n';
                classEnd = '' +
                    '}\n';
                break;
        }

        return {
            "start": classStart,
            "style": style,
            "end": classEnd
        };
    };


    /*  Function to generate a table from classes
     *  Parameters:
     *      classes:array, array of class "objects"
     *      classType:string, Sequential or Qualitative
     */
    classify.prototype.displayClasses = function(classes, classType) {
        //Get the table elements
        var tableHeader = $('#classify-class-table-header');
        var tableContent = $('#classify-class-table-content');

        //Empty the table
        tableHeader.empty();
        tableContent.empty();

        //Create the rows
        var nbClasses = classes.length;
        switch(classType) {
            case 'Sequential':
                tableHeader.append(
                    '<tr><th class="color-col">Color</th>' +
                    '<th>Lower bound</th><th>Upper bound</th></tr>'
                );
                for(var i = 0; i < nbClasses; i++) {
                    var row = ['',
                        '<tr>',
                            '<td class="color-col" bgcolor = "',
                                classes[i].color,
                                '"/>',
                            '<td>',
                                classes[i].lowerBound,
                            '</td>',
                            '<td>',
                                classes[i].upperBound,
                            '</td>',
                        '</tr>'
                    ].join('');
                    tableContent.append(row);
                }
                break;
            case 'Qualitative':
                tableHeader.append(
                    '<tr><th class="color-col">Color</th>' +
                    '<th>Value</th></tr>');
                for(var i = 0; i < nbClasses; i++) {
                    var value = classes[i].value;
                    if(!value) {
                        value = '<span class="novalue">Empty (null)</span>';
                    }
                    var row = ['',
                        '<tr>',
                            '<td class="color-col" bgcolor = "',
                                classes[i].color,
                            '"/>',
                            '<td>',
                                value,
                            '</td>',
                        '</tr>'
                    ].join('');
                    tableContent.append(row);
                }
                break;
        }
    };


    /*  This function gets any data source in a group using a regex.
     *  Parameters:
     *      group:Group, contains the text to parse for datasources
     */
    classify.prototype.updateDatasources = function(group) {
        var datasources = [];
        //Get data formatted with DATA or DATA: in a single line
        var singleLineRegex = /^[\t\ ]*DATA[\ :]*(['"](.*)['"])/gm;
        var match = singleLineRegex.exec(group.content);
        while(match !== null) {
            datasources.push(match[2]);
            match = singleLineRegex.exec(group.content);
        }

        //Get data formatted over multiple lines with DATA { ... }
        var multilineRegex = /(^|[\ \t]+)DATA[\ \t]*\{((.|[\n\r])*?)\}/gm;
        match = multilineRegex.exec(group.content);
        while(match !== null) {
            //get each datasource in a DATA {} block
            var innerDataRegex = /['"](.*)['"]/gm;
            var innerMatch = innerDataRegex.exec(match[2]);
            while(innerMatch !== null) {
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

    classify.prototype.getDatasourcePath = function() {
        var dropdownDatasources = $('#classify-input-datasource');
        var datasource = dropdownDatasources.val();

        //Get shapefiles path
        var shapepathRegex = /SHAPEPATH[ :]*'(.*)'/;
        var shapepath = shapepathRegex.exec(ScribeUI.workspace.openedMap.map);

        //Get shapefiles path if it exists, else use datasource as is
        if(shapepath && shapepath.length > 0) {
            datasource = shapepath[1] + datasource;
        }

        return ScribeUI.workspace.name +
            '/' + ScribeUI.workspace.openedMap.name +
            '/map/' + datasource;
    };

    classify.prototype.updateFields = function() {
        var datasource = this.getDatasourcePath();
        $("#classify-field-info").hide();
        $.ajax({
            url: $API + "/classify/field/getlist",
            type: "POST",
            data: {
                'datasource': datasource
            },
            success: function(result) {
                var dropdown = $('#classify-input-field');
                dropdown.empty();

                if(result.errors.length > 0) {
                    var fieldInfo = $("#classify-field-info");
                    fieldInfo.show();
                    fieldInfo.text(result.errors);
                } else {
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

    classify.prototype.getFieldInfo = function(field) {
        var datasource = this.getDatasourcePath();

        var loadSpinner = $('#field-load-spinner');
        loadSpinner.show();

        var fieldInfo = $("#classify-field-info");
        fieldInfo.hide();

        var self = this;
        $.ajax({
            url: $API + "/classify/field/getinfo",
            type: "POST",
            data: {
                'datasource': datasource,
                'field': field,
            },
            success: function(result) {
                var fieldType = result.geom_type;

                fieldInfo.show();
                loadSpinner.hide();

                fieldInfo.text("Informations for field '" + field + "'");
                fieldInfo.append("\nField type: " + fieldType);
                fieldInfo.append("\nNumber of values: " + result.nb_values);
                fieldInfo.append("\nUnique values: " + result.unique_values);

                self.fieldType = fieldType;

                switch(fieldType) {
                    case "String":
                        //Don't let the users classify strings in a sequence
                        self.setClassTypeDropdownOptions(['Qualitative']);
                        break;
                    case "Real":
                    case "Integer":
                        //Let the users classify numbers like they want
                        self.setClassTypeDropdownOptions(
                            ['Sequential', 'Qualitative']);

                        //Display minimum and maximum
                        fieldInfo.append("\nMinimum: " + result.minimum);
                        fieldInfo.append("\nMaximum: " + result.maximum);

                        //Set start and end value
                        self.startValue = result.minimum;
                        self.endValue = result.maximum;
                        break;
                    default:
                        break;
                }
                self.generateClasses();

            }
        });
    };

    /*  This function gets every unique value for field and saves them to
     *  this.values using a callback
     */
    classify.prototype.setValues = function(field) {
        var self = this;
        if(field) {
            $.ajax({
                url: $API + "/classify/field/getdata",
                type: "POST",
                data: {
                    'datasource': self.getDatasourcePath(),
                    'field': field
                },
                success: function(result) {
                    if(result.status == 1) {
                        self.handleSetValuesComplete(result.values);
                    }
                }
            });
        }
    };


    /*  Set the different options in the 'Class type' dropdown
     *  Parameters:
     *      options:array, array of strings to insert as options
     */

    classify.prototype.setClassTypeDropdownOptions = function(options) {
        //Get the element
        var dropdown = $('#classify-input-classType');

        //Remove existing options
        dropdown.empty();

        //Insert new options
        var nbOptions = options.length;
        for(var i = 0; i < nbOptions; i++) {
            dropdown.append('<option>' + options[i] + '</option>');
        }

        //Call change handler
        dropdown.change();
    };

    //Event handlers
    classify.prototype.handleDialogLoadComplete = function(content) {

        var dialogDiv = $('<div id="classify-dialog"/>');
        dialogDiv.append(content);

        //At this point, the dialog is done loading
        $('.main').append(dialogDiv);
        dialogDiv.hide();

        //Save a few default values from the dialogDiv
        this.classType = $('#classify-input-classType').val();
        this.nbClasses = parseInt($('#classify-input-numberClasses').val());
        this.mode = $('#classify-input-mode').val();

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

        $('#classify-input-numberClasses').change(
            $.proxy(this.handleNumberClassesChange, this)
        );
    };

    classify.prototype.handleClassifyButtonClick = function(event) {
        var classes = this.generateClasses();
        var output = this.generateText(classes);

        var group = ScribeUI.workspace.openedMap.getGroupByName(
            $('#classify-input-group').val()
        );
        var datasource = $('#classify-input-datasource').val();

        this.insertText(output, group, datasource);

        $('#classify-dialog').dialog('close');
    }

    classify.prototype.handleSetValuesComplete = function(values) {
        this.values = values;
        this.generateClasses();
    };

    classify.prototype.handleDropdownGroupsChange = function(event) {
        this.updateDatasources(
            ScribeUI.workspace.openedMap.getGroupByName(
                $(event.target).val()));
    };

    classify.prototype.handleDropdownDatasourcesChange = function(event) {
        this.updateFields();
    };

    classify.prototype.handleDropdownFieldsChange = function(event) {
        var dropdownFieldsVal = $(event.target).val();
        if(dropdownFieldsVal !== null) {
            this.field = dropdownFieldsVal;
            this.getFieldInfo(dropdownFieldsVal);
            if(this.classType == "Qualitative") {
                this.setValues(this.field);
            }
        }
    };

    classify.prototype.handleDropdownClassTypeChange = function(event) {
        var dropdownClassType = $(event.target);
        this.classType = dropdownClassType.val();
        switch(this.classType) {
            case 'Sequential':
                $('#classify-options-sequential').show();
                $('#classify-options-qualitative').hide();
                break;
            case 'Qualitative':
                $('#classify-options-sequential').hide();
                $('#classify-options-qualitative').show();
                this.setValues(this.field);
                break;
        }
        this.generateClasses();
    };

    classify.prototype.handleColorButtonPress = function(event) {
        this.colorChooser.open(
            $.proxy(this.handleColorChooserClose, this)
        );
    };

    classify.prototype.handleColorChooserClose = function(colorRange) {
        $('.color-input').val(colorRange);
        this.colors = colorRange;
        this.generateClasses();
    };

    classify.prototype.handleNumberClassesChange = function(event) {
        var nbClassesInput = $(event.target);
        if(nbClassesInput) {
            this.nbClasses = nbClassesInput.val();
            this.generateClasses();
        }
    };

    //Add the plugin to ScribeUI
    ScribeUI.addPlugin(new classify());
});});
