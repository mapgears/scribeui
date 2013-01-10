#!/usr/bin/python
# -*- coding: iso-8859-1 -*-

import json
import re
import sys

def parseDict(data, scales, files):
    for d in data:
        dType =  type(data[d])
        if dType == type(dict()):
            if isScale(d) == False:
                parseDict(data[d], scales, files)
        elif dType == type(list()):
            parseList(d, data[d], scales, files)
        elif dType == type(unicode()):
            if isVar(data[d]):
                key = data[d][4:]
                value = VAR[key]
            else:
                key = d
                value = data[key]
            
            vType = type(value)
            if d == "VOID":
                if vType == type(dict()):
                    parseDict(value, scales, files)
                elif vType == type(list()):
                    parseList(key, value, scales, files, False)
                elif vType == type(unicode()):
                    write(value, scales, files)
                elif vType == type(int()):
                    write(str(value), scales, files)
            elif vType == type(list()):
                if isScaleList(value):
                    maxScale = maximumScale(scales)
                    minScale = minimumScale(scales)
                    parseScaleList(d, value, files, minScale, maxScale)
            else:
                 if isScale(d) == False:
                     write(d + " " + value, scales, files)
        elif dType == type(int()):
            value = str(data[d])    
            if isScale(value) == False:
                write(d + " " + value, scales, files)

def parseList(d, data, scales, files, close=True):
    if (closeTag(data) == True and isScale(d) == False and isScaleList(data) == False and isVar(d) == False and close == True):
        write(d, scales, files)

    if (isScaleList(data) == True and close == True):
        maxScale = maximumScale(scales)
        minScale = minimumScale(scales)
        parseScaleList(d, data, files, minScale, maxScale, close)
    else:
        for item in data:
            dType = type(item)
            if dType == type(dict()):
                for i in item:
                    if isScale(i):
                        maxScale = maximumScale(scales)
                        minScale = minimumScale(scales)
                        parseScale(i, item[i], files, minScale, maxScale)
                    else:
                        parseDict(item, scales, files)
            else:
                print "Erreur: JSON mal formé"

    if (closeTag(data) == True and isScale(d) == False and isScaleList(data) == False and close == True):
        write("END", scales, files)

def parseScaleList(d, data, files, minScale, maxScale, close=True):
    for item in data:
        for scale in item:
            scales = scaleToScaleList(scale, minScale, maxScale)
           
            if isVar(item[scale]):
                key = item[scale][4:]
                value = VAR[key]
            else:
                key = scale
                value = item[key]

            vType = type(value)

            if vType == type(dict()):
                write(d, scales, files)
                parseDict(value, scales, files)
            elif vType == type(list()):
                write(d, scales, files)
                parseList(key, value, scales, files)
            elif vType == type(unicode()):
                write(d + " " + value, scales, files)
            elif vType == type(int()):
                write(d + " " + str(value), scales, files)

        if closeTag(data) == True:
            write("END", scales, files) 

def parseScale(scale, data, files, minScale, maxScale):
    scales = scaleToScaleList(scale, minScale, maxScale)

    for d in data:
        for item in d:
            if isVar(d[item]):
                key = item
                value = VAR[d[item][4:]]
            else:
                key = item
                value = d[key]
   
            vType = type(value)

            if vType == type(dict()):
                write(item, scales, files)
                parseDict(value, scales, files)
            elif vType == type(list()):
                parseList(key, value, scales, files)
            elif vType == type(unicode()):
                write(item + " " + value, scales, files)
            elif vType == type(int()):
                write(item + " " + str(value), scales, files)

def scaleToScaleList(scale, minScale, maxScale):
    scales = {}
    if re.match(r"[0-9]{1,2}:{1}[0-9]{1,2}", scale):
        s1 = int(re.search('(?<!:)\w+', scale).group(0))
        s2 = int(re.search('(?<=:)\w+', scale).group(0))
        for i in range(s1, s2 + 1):
            if (i >= minScale) and (i <= maxScale):
                scales[str(i)] = SCALES[str(i)]
                
    elif re.match(r"[0-9]+", scale):
        if (int(scale) >= minScale) and (int(scale) <= maxScale): 
            scales[scale] = SCALES[scale]

    return scales

def isScale(string):
    if re.match(r"[0-9]+(:[0-9]+)*", string):
        return True
    else:
        return False

def isScaleList(data):
    scale = False
    for value in data:
        for d in value: 
            if isScale(d) == True:
                scale = True
            else:
                return False
    return scale

def closeTag(data):
    close = True
    for d in data:
        for item in d:
            if (isScale(item) == True and type(d[item]) != type(list())):
                close = False
            else:
                close = True
    return close

def isVar(string):
    if string[:4]== "VAR.":
        return True
    else:
        return False 

def maximumScale(scales):
    maxScale = 0
    for scale in scales:
        if int(scale) > maxScale:
            maxScale = int(scale)
    return maxScale

def minimumScale(scales):
    minScale = 99
    for scale in scales:
        if int(scale) < minScale:
            minScale = int(scale)
    return minScale

def write(string, scales, files):
    for value in scales:
        if string == "LAYER":
            files[value].write(string + "\n")
            if value == str(minimumScale(SCALES)):
                files[value].write("MAXSCALEDENOM 999999999" + "\n")
            else:
                files[value].write("MAXSCALEDENOM " + str(int(SCALES[str(int(value) - 1)])-1) + "\n")
                #files[value].write("MAXSCALEDENOM " + str(int(SCALES[str(int(value) - 1)])-1) + "\n")

            files[value].write("MINSCALEDENOM " + str(scales[value]) + "\n")
        elif re.match(r"^NAME", string):
            text = string
            text = re.sub(r"'$", value + "'", text)
            text = re.sub(r"\"$", value + "\"", text)
            files[value].write(text + "\n")
        else:
            files[value].write(string + "\n")

def openLayerFiles():
    layerFiles = {}
    for value in SCALES:
        layerfile = open(sys.argv[2]+"layers/level" + value + ".map", "w+")
        layerFiles[value] = layerfile
    return layerFiles

def openMapFile():  
    mapFile = {"1": open(sys.argv[2]+"map/"+sys.argv[3], "w+")}
    return mapFile

def closeFiles(files):
    for value in files:
        files[value].close()

def jsonToLayer():
    layerFiles = openLayerFiles()
    for layer in LAYERS:
        parseDict(layer, SCALES, layerFiles)
    closeFiles(layerFiles)

def jsonToMap():
    jsonToLayer()
    mapFile = openMapFile()
    #write("MAP", {"1": None}, mapFile)
    parseList("MAP", MAP, {"1": None}, mapFile, True)
    mapFile["1"].seek(-4, 2)
    write("###SYMBOLS###", {"1": None}, mapFile)    
    for value in range(1,len(SCALES) + 1):
        layerfile = open(sys.argv[2]+"layers/level" + str(value) + ".map", "r")
        write(layerfile.read(),{"1": None},mapFile)
        closeFiles(layerfile)
    write("END", {"1": None}, mapFile)
    closeFiles(mapFile)

def string2json(string):
    t = re.sub(r"\##.*", "", string)

    t = re.sub(r"(?<=\w)+:\s*@", ":", t)
    t = re.sub(r"@", "VOID:", t)
    
    expressions = re.findall(r"(?<=EXPRESSION:).+", t)
    t = re.sub(r"(?<=EXPRESSION:).+", "FLAGEXP", t)

    rangeitem = re.findall(r"(?<=RANGEITEM:).+", t)
    t = re.sub(r"(?<=RANGEITEM:).+", "FLAGRANGE", t)

    text = re.findall(r"(?<=TEXT:).+", t)
    t = re.sub(r"(?<=TEXT:).+", "FLAGTEXT", t)

    escape = re.findall(r"(?<=ESCAPE/).+(?=/ESCAPE)", t)
    t = re.sub(r"ESCAPE/.+/ESCAPE", "FLAGESCAPE", t)

    t = re.sub(r"(?<!\()\s*\[", ":[", t)
    t = re.sub(r"\]", "]", t)

    t = re.sub(r"\"\s*(?=(\"|'))",  re.escape("\\") + "\"", t)
    t = re.sub(r"(?<=(\"|'))\s*\"",  re.escape("\\") + "\"", t)

    t = re.sub(r"(?<!(epsg|EPSG)):\s*", "\":", t)
    t = re.sub(r"(?<!(epsg|EPSG))\s*:(?=\")", ":\"" + re.escape("\\"), t)
    t = re.sub(r"(?<!(epsg|EPSG))\s*:(?=(\w|'|-))", ":\"", t)

    t = re.sub(r":/", ":\"/", t)
    t = re.sub(r"/\s", "/\"", t)
    t = re.sub(r"/\"", "/\"}", t)

    t = re.sub(r"(?<!'wms_title')(?<!\s)*(?<!')(?<!(\w|,|\)|\(|\*))+\s(?=[a-zA-Z_])(?!(epsg|EPSG|\)))", "{\"", t)
    t = re.sub(r"\s(?=([0-9]|[0-9]{2})(?=(-|\")))", "{\"", t)
    #t = re.sub(r"\s(?=([0-9]|[0-9]{2})-)", "{\"", t)

    t = re.sub(r"\"\s+(?!(\w|'|-|\(|\)|,|\"|=|<|>|!|\*))", "\\\"\"},\n", t)
    t = re.sub(r"(?<=\))\s+(?!(\w|'|-|\(|\)|,|\"|=|<|>|!|\*))", "\"},\n", t)
    
    t = re.sub(r"(?<=([a-zA-Z_][0-9]))\s(?!\w)", "\"},\n", t)
    t = re.sub(r"(?<=[a-zA-Z_])\s(?!(\w|'|-|\(|\)|,|\"|=|<|>|!|\*))", "\"},\n", t)
    #t = re.sub(r"(?<=([0-9]|'))\s+(?!(\w|'|-))", "\"},\n", t)
    t = re.sub(r"(?<=([0-9]|'))\s+(?!(\w|'|-|\(|\)|,|\"|=|<|>|!|\*))", "\"},\n", t)
    
    t = re.sub(r",\s+\n*\]", "]", t)
    
    t = re.sub(r"(?<!(\w|'))\]", "]}", t)

    t = re.sub(r"\}\s*\n*\{", "},{", t)
    t = re.sub(r"\}\n*\s*\]\},\{\"LAYERS\"", "}],\"LAYERS\"", t)
    t = re.sub(r"\}\n*\s*\]\},\{\"MAP\"", "}],\"MAP\"", t)
    t = re.sub(r"\}\n*\s*\]\},\{\"VAR\"", "}],\"VAR\"", t)
    t = re.sub(r"^\s*\n*{\"", "", t)
    t = re.sub(r"(?<=[0-9])-(?=[0-9])", ":", t)
    t = re.sub(r"\s(?=([0-9]|[0-9]{2})+\":)", "{\"", t)

    for i in range (0, len(expressions)):
        exp = re.sub(r"\"", re.escape("\\") + "\"", expressions[i].lstrip())
        t = re.sub(r"FLAGEXP", exp, t, 1)

    for i in range (0, len(rangeitem)):
        rng = re.sub(r"\"", re.escape("\\") + "\"", rangeitem[i].lstrip())
        t = re.sub(r"FLAGRANGE", rng, t, 1)

    for i in range (0, len(text)):
        txt = re.sub(r"\"", re.escape("\\") + "\"", text[i].lstrip())
        t = re.sub(r"FLAGTEXT", txt, t, 1)

    for i in range (0, len(escape)):
        t = re.sub(r"FLAGESCAPE", escape[i], t, 1)

    return ("{\"" + t)

def list2dict(ls):
    dc = {}
    for item in ls:
        for key in item:
            dc[key] = item[key]
    return dc
            
    

MAPNAME = sys.argv[1]
json_file = open(sys.argv[2]+"temp.json", "w+")

simplefile = open(MAPNAME);
simple = simplefile.read();
simplejson = string2json(simple);
json_file.write(simplejson);
json_file.close();

json_file = open(sys.argv[2]+"temp.json")
data = json.load(json_file);
json_file.close();

MAP = data["MAP"]
LAYERS = data["LAYERS"]
VAR = list2dict(data["VAR"])
SCALES = list2dict(data["SCALES"])

jsonToMap()
