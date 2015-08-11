function colorMenu(){
    this.colors = [];
    this.selectedColor = null;
    var self = this;

    //Create the dialog
    $.get("classify/html/colorMenu.html", null,
        $.proxy(this.handleDialogLoadComplete, this));
}

/*  Open the colorMenu dialog
 *  Paramters:
 *      - callback, function telling us what to do with the colors when
 *                  closing the dialog
 */
colorMenu.prototype.open = function(callback){
    var self = this;
    $("#colorMenu-dialog").dialog({
        autoOpen: false,
        resizable: false,
        modal: true,
        width: "420px",
        title: "Select colors",
        buttons: {
            Confirm: function(){
                callback(self.colors);
                $(this).dialog("close");
            },
            Cancel: function(){
                $(this).dialog("close");
            }
        },
        close: function() {}
    }).dialog("open");
};

//Update the field containing the colors preview
colorMenu.prototype.updateSelectedColors = function(){
    var self = this;
    var colorsContainer = $('.colorMenu-selected-colors');
    colorsContainer.empty();
    $.each(this.colors, function(i, item) {
        var colorSquare = $("<div>",
            {class: "colorMenu-colorSquare"}
         );
        colorSquare.css('background-color', item);
        colorSquare.data("number", i);
        colorSquare.click(function() {
            if(self.selectedColor) {
                self.selectedColor.removeClass('colorMenu-colorSquare-selected');
            }
            $(this).addClass('colorMenu-colorSquare-selected');
            self.selectedColor = $(this);
        })
        colorsContainer.append(colorSquare);
    });
}

//Create an a array of colors ranging between color1 and color2
colorMenu.prototype.generateColorRange = function(
        numberOfColors, color1, color2){
    colorRange = [];
    color1 = tinycolor(color1);
    color2 = tinycolor(color2);
    var step = 100 / (numberOfColors - 1); //Percentage of mix
    for(var i = 0; i < 100; i += step){
        colorRange.push(
            tinycolor.mix(color1, color2, amount = i).toHexString());
    }
    colorRange.push(color2.toHexString());
    return colorRange;
}

//Get color square from index
colorMenu.prototype.getColorElementFromIndex = function(index) {
    var colorElements = $('.colorMenu-colorSquare');
    var element = colorElements[index];
    return $(element);
}

colorMenu.prototype.handleDialogLoadComplete = function(content) {

    var dialogDiv = $('<div id="colorMenu-dialog"/>');
    dialogDiv.append(content);

    //Dialog done loading
    dialogDiv.hide();
    $('.main').append(dialogDiv);

    //Setup events
    //Add single color
    $('#colorMenu-color-single-button').click(
        $.proxy(this.handleColorSingleButtonClick, this)
    );

    //Add color range
    $('#colorMenu-color-range-button').click(
        $.proxy(this.handleColorRangeButtonClick, this)
    );

    $('#colorMenu-remove').click(
        $.proxy(this.handleRemoveButtonClick, this)
    );

    $('#colorMenu-move-left').click(
        $.proxy(this.handleMoveLeftClick, this)
    );

    $('#colorMenu-move-right').click(
        $.proxy(this.handleMoveRightClick, this)
    );

    $('#colorMenu-clear').click(
        $.proxy(this.handleClearButtonClick, this)
    );
};

colorMenu.prototype.handleRemoveButtonClick = function(event) {
    if(this.selectedColor) {
        var selectedIndex = this.selectedColor.data().number;
        this.colors.splice(selectedIndex, 1);
        this.updateSelectedColors();
        this.selectedColor = null;
    }
};

colorMenu.prototype.handleMoveLeftClick = function(event) {
    if(this.selectedColor) {
        var selectedIndex = this.selectedColor.data().number;
        if(selectedIndex > 0) {
            var tmpColor = this.colors[selectedIndex - 1];
            this.colors[selectedIndex - 1] = this.colors[selectedIndex];
            this.colors[selectedIndex] = tmpColor;
            this.updateSelectedColors();

            this.selectedColor = this.getColorElementFromIndex(selectedIndex - 1);
            this.selectedColor.addClass('colorMenu-colorSquare-selected');
        }
    }
};

colorMenu.prototype.handleMoveRightClick = function(event) {
    if(this.selectedColor) {
        var selectedIndex = this.selectedColor.data().number;
        if(selectedIndex < this.colors.length - 1) {
            var tmpColor = this.colors[selectedIndex + 1];
            this.colors[selectedIndex + 1] = this.colors[selectedIndex];
            this.colors[selectedIndex] = tmpColor;
            this.updateSelectedColors();

            this.selectedColor = this.getColorElementFromIndex(selectedIndex + 1);
            this.selectedColor.addClass('colorMenu-colorSquare-selected');
        }
    }
};

colorMenu.prototype.handleClearButtonClick = function(event) {
    this.colors = [];
    this.updateSelectedColors();
    this.selectedColor = null;
};

colorMenu.prototype.handleColorSingleButtonClick = function(event) {
    this.colors.push($('#colorMenu-color-single-input').val());
    this.updateSelectedColors();
};

colorMenu.prototype.handleColorRangeButtonClick = function(event) {
    var nbColors = parseInt($('#colorMenu-numberOfColors').val());
    var color1 = $('#colorMenu-color1').val();
    var color2 = $('#colorMenu-color2').val();
    if(nbColors > 0 && color1 && color2){
        var colorRange = this.generateColorRange(nbColors, color1, color2);
        this.colors = $.merge(this.colors, colorRange);
        this.updateSelectedColors();
    }
};
