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
            if isScaleList(data[d]):
                maxScale = maximumScale(scales)
                minScale = minimumScale(scales)
                parseScale(d, data, files, minScale, maxScale)
            else:
                write(d, scales, files)
                parseList(data[d], scales, files, True)
        elif dType == type(unicode()):
            if isVar(data[d]):
                value = VAR[data[d][4:]]
            else:
                value = data[d]

            vType = type(value)
            if d == "VOID":
                if vType == type(dict()):
                    parseDict(value, scales, files)
                elif vType == type(list()):
                    parseList(value, scales, files, False)
                elif vType == type(unicode()):
                    write(value, scales, files)
                elif vType == type(int()):
                    write(str(value), scales, files)                
            else:
                 if isScale(d) == False:
                     write(d + " " + value, scales, files)
        elif dType == type(int()):
            value = str(data[d])    
            if isScale(value) == False:
                write(d + " " + value, scales, files)

def parseList(data, scales, files, close):
    scale = False

    for item in data:
        dType = type(item)
        if dType == type(dict()):
            for d in item:
                if isScale(d):
                    scale = True
                    
            parseDict(item, scales, files)
        else:
            print "Erreur: JSON mal formé"

    if (scale == False) and (close == True):
        write("END", scales, files)

def parseScale(d, data, files, minScale, maxScale):
    for item in data[d]:
        scales = {}
        for scale in item:
            if re.match(r"[0-9]{1,2}:{1}[0-9]{1,2}", scale):
                s1 = int(re.search('(?<!:)\w+', scale).group(0))
                s2 = int(re.search('(?<=:)\w+', scale).group(0))
                scales = {}
                for i in range(s1, s2 + 1):
                    if (i >= minScale) and (i <= maxScale):
                        scales[str(i)] = SCALES[str(i)]
                
                if isVar(item[scale]):
                    value = VAR[item[scale][4:]]
                else:
                    value = item[scale]                          
                
            elif re.match(r"[0-9]{1,2}", scale, files):
                scales = {}
                if (int(scale) >= minScale) and (int(scale) <= maxScale): 
                    scales[i] = SCALES[scale]
                
                if isVar(item[scale]):
                    value = VAR[item[scale][4:]]
                else:
                    value = item[scale]
                    
            vType = type(value)

            if vType == type(dict()):
                write(d, scales, files)
                parseDict(value, scales, files)
            elif vType == type(list()):
                write(d, scales, files)
                parseList(value, scales, files, True)
            elif vType == type(unicode()):
                write(d + " " + value, scales, files)
            elif vType == type(int()):
                write(d + " " + str(value), scales, files)             

def isScale(string):
    if re.match(r"[0-9]:*[0-9]*", string):
        return True
    else:
        return False

def isScaleList(data):
    scale = False
    for value in data:
        for d in value:
                if isScale(d):
                    scale = True
                
    return scale

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
    write("MAP", {"1": None}, mapFile)
    parseList(MAP, {"1": None}, mapFile, True)
    mapFile["1"].seek(-4, 2)
    write("###SYMBOLS###", {"1": None}, mapFile)    
    for value in range(1,len(SCALES) + 1):
        layerfile = open(sys.argv[2]+"layers/level" + str(value) + ".map", "r")
        write(layerfile.read(),{"1": None},mapFile)
        closeFiles(layerfile)
    write("END", {"1": None}, mapFile)
    closeFiles(mapFile)

def string2json(string):
    t = re.sub(r"(?<=\w)+:\s*@", ":", string)
    t = re.sub(r"@", "VOID:", t)
    
    expressions = re.findall(r"(?<=EXPRESSION:).+", t)
    t = re.sub(r"(?<=EXPRESSION:).+", "FLAGEXP", t)

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

    t = re.sub(r"(?<!'wms_title')(?<!\s)*(?<!')(?<!(\w|,|\)))+\s(?=[a-zA-Z_])(?!(epsg|EPSG|\)))", "{\"", t)
    t = re.sub(r"\s(?=([0-9]|[0-9]{2})-)", "{\"", t)

    t = re.sub(r"\"\s+(?!(\w|'|-|\(|\)|,|\"|=|<|>|!))", "\\\"\"},\n", t)
    t = re.sub(r"(?<=\))\s+(?!(\w|'|-|\(|\)|,|\"|=|<|>|!))", "\"},\n", t)
    
    t = re.sub(r"(?<=([a-zA-Z_][0-9]))\s(?!\w)", "\"},\n", t)
    t = re.sub(r"(?<=[a-zA-Z_])\s(?!(\w|'|-|\(|\)|,|\"|=|<|>|!))", "\"},\n", t)
    #t = re.sub(r"(?<=([0-9]|'))\s+(?!(\w|'|-))", "\"},\n", t)
    t = re.sub(r"(?<=([0-9]|'))\s+(?!(\w|'|-|\(|\)|,|\"|=|<|>|!))", "\"},\n", t)
    
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
        t = re.sub(r"FLAGEXP", expressions[i].lstrip(), t, 1)

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
