function POI(name, lon, lat, scale, projection){
    this.map = null;

    this.name = name;

    this.lon = lon;

    this.lat = lat;

    this.scale = scale;
    
    this.projection = projection;   
}

POI.prototype.findScaleLevel = function(denom){
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

POI.prototype.findScaleDenom = function(level){
    return this.map.OLScales[level];
}
