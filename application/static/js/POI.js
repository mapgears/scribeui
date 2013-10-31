function POI(name, lon, lat, scale){
    this.name = name;
    this.lon = lon;
    this.lat = lat;
    this.scale = scale   
}

POI.prototype.zoomTo = function(){
    var projection = this.workspace.openedMap.OLMap.getProjection();
    var lonLat = new OpenLayers.LonLat(this.lon, this.lat);
    var transformed = lonLat.transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection(projection.toUpperCase()));
    this.workspace.openedMap.OLMap.setCenter(transformed, this.findScaleLevel(this.scale));
}

POI.prototype.findScaleLevel = function(denom){
    diff0 = 999999999;
    for(i in this.workspace.openedMap.OLScales){
        diff = Math.abs(this.workspace.openedMap.OLScales[i] - denom);
        if(diff < diff0){
            diff0 = diff;
            var level = i; 
        }
    }
    //Scribe maps scales start at 1 instead of 0
    if(typeof(this.workspace.openedMap.OLMap.scales[0]) == 'undefined')
         return level-1;
     else
         return level;
}

POI.prototype.findScaleDenom = function(level){
    return this.workspace.openedMap.OLScales[level];
}
