ScribeUI.POI = function(name, lon, lat, scale, projection){
    this.map = null;

    this.name = name;

    this.lon = lon;

    this.lat = lat;

    this.scale = scale;
    
    this.projection = projection;   
}

ScribeUI.POI.prototype.findScaleLevel = function(denom){
    diff0 = 999999999;
    for(i in this.map.OLScales){
        diff = Math.abs(this.map.OLScales[i] - denom);
        if(diff < diff0){
            diff0 = diff;
            var level = i; 
        }
    }
    //Scribe maps scales start at 1 instead of 0
    if(typeof(this.map.OLMap.scales[0]) == 'undefined')
         return level-1;
     else
         return level;
}

ScribeUI.POI.prototype.findScaleDenom = function(level){
    return this.map.OLScales[level];
}

//Static functions:
function zoomToPOI(){
    if(ScribeUI.workspace && ScribeUI.workspace.openedMap){
        var name = ScribeUI.UI.poi.select().val();
        ScribeUI.workspace.openedMap.zoomToPOI(name);
    }    
}

function addPOI(){
    if(ScribeUI.workspace && ScribeUI.workspace.openedMap){
        $("#addpoi-form").dialog({
            autoOpen: false,
            resizable: false,
            modal: true,
            buttons: {
                "Add": function() {
                    var name = $("#newpoi-name").val();
                    if(ScribeUI.workspace.openedMap.getPOIByName(name)){
                        alert('A poi with that name exists already.');
                    } else{
                        ScribeUI.workspace.openedMap.addPOI(name);    
                    }
                    
                    $(this).dialog("close");
                },
                Cancel: function() {
                    $(this).dialog("close");
                }
            },
            close: function() {
                $(this).find('input').val('');
            }
        }).dialog("open");
    }
}