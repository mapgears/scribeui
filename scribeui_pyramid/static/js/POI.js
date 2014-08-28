ScribeUI.POI = function(name, lon, lat, scale, projection){
    this.map = null;

    this.name = name;

    this.lon = lon;

    this.lat = lat;

    this.scale = scale;
    
    this.projection = projection;   
}

ScribeUI.POI.prototype.findScaleLevel = function(denom){
    var diff0 = 999999999;
    var diff;
    for(i in this.map.OLScales){
        diff = Math.abs(this.map.OLScales[i] - denom);
        if(diff < diff0){
            diff0 = diff;
            var level = i; 
        }
    }
    //Displayed zoom levels are actually one level too high.
    return level-1;
}

ScribeUI.POI.prototype.findScaleDenom = function(level){
    return this.map.OLScales[level];
}

//Static functions:
ScribeUI.POI.zoomToPOI = function(){
    if(ScribeUI.workspace && ScribeUI.workspace.openedMap){
        var name = ScribeUI.UI.poi.select().val();
        ScribeUI.workspace.openedMap.zoomToPOI(name);
    }    
}

ScribeUI.POI.addPOI = function(){
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

ScribeUI.POI.removePOI = function(){
    if(ScribeUI.workspace && ScribeUI.workspace.openedMap){
        var name = ScribeUI.UI.poi.select().val();
        ScribeUI.workspace.openedMap.removePOI(name);    
    }
}
