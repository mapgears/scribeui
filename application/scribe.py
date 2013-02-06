#!/usr/bin/python2.7
# -*- coding: iso-8859-1 -*-

import json
import re
import getopt, sys
import os.path
import codecs

def parseDict(data, scales, files, indentation):
    for d in data:
        dType =  type(data[d])
        if dType == type(dict()):
            if isScale(d) == False:
                parseDict(data[d], scales, files, indentation)
        elif dType == type(list()):
            parseList(d, data[d], scales, files, indentation)
        elif dType == type(unicode()):
            if d == "VARIABLE":
                value = VAR[data[d]]
                vType = type(value)
    
                if vType == type(list()):
                    parseList(data[d], value, scales, files, indentation, False)
            elif data[d][:9] == "VARIABLE:":
                value = parseVariable(data[d][9:])
                vType = type(value)
                
                if vType == type(list()):
                    parseList(d, value, scales, files, indentation)
                elif vType == type(unicode()):
                    write(d + " " + value, scales, files, indentation)
                elif vType == type(int()):
                    write(d + " " + str(value), scales, files, indentation)
            elif d == "VOID":
                value = data[d]
                write(comment(value.lstrip()), scales, files, indentation)
            else:
                value = data[d]
                vType = type(value)
                if vType == type(list()):
                    if isScaleList(value):
                        maxScale = maximumScale(scales)
                        minScale = minimumScale(scales)
                        parseScaleList(d, value, files, minScale, maxScale, indentation)
                else:
                    if isScale(d) == False:
                        write(d + " " + value, scales, files, indentation)
        elif dType == type(int()):
            value = str(data[d])    
            if isScale(value) == False:
                write(d + " " + value, scales, files, indentation)

def parseList(d, data, scales, files, indentation, close=True):
    if (closeTag(data) == True and isScale(d) == False and isScaleList(data) == False and d != "VARIABLE" and close == True):
        write(d, scales, files, indentation)
        indentation = addIndentation(indentation, INDENTATION)

    if (isScaleList(data) == True and close == True):
        maxScale = maximumScale(scales)
        minScale = minimumScale(scales)
        parseScaleList(d, data, files, minScale, maxScale, indentation, close)
    else:
        for item in data:
            dType = type(item)
            if dType == type(dict()):
                for i in item:
                    if isScale(i):
                        maxScale = maximumScale(scales)
                        minScale = minimumScale(scales)
                        parseScale(i, item[i], files, minScale, maxScale, indentation)
                    else:
                        parseDict(item, scales, files, indentation)
            else:
                print "Erreur: JSON mal formé"

    if (closeTag(data) == True and isScale(d) == False and isScaleList(data) == False and close == True):
        indentation = substractIndentation(indentation, INDENTATION)
        write("END", scales, files, indentation)

def parseScaleList(d, data, files, minScale, maxScale, indentation, close=True):
    for item in data:
        for scale in item:
            scales = scaleToScaleList(scale, minScale, maxScale)
           
            if scale == "VARIABLE":
                key = item[scale]
                value = VAR[key]
            elif item[scale][:9] == "VARIABLE:":
                key = scale
                value = parseVariable(item[scale][9:])
            else:
                key = scale
                value = item[key]

            vType = type(value)

            if vType == type(dict()):
                write(d, scales, files, indentation)
                parseDict(value, scales, files, indentation)
            elif vType == type(list()):
                write(d, scales, files, indentation)
                indentation = addIndentation(indentation, INDENTATION)
                parseList(key, value, scales, files, indentation)               
            elif vType == type(unicode()):
                write(d + " " + value, scales, files, indentation)
            elif vType == type(int()):
                write(d + " " + str(value), scales, files, indentation)

        if closeTag(data) == True:
            indentation = substractIndentation(indentation, INDENTATION)
            write("END", scales, files, indentation) 

def parseScale(scale, data, files, minScale, maxScale, indentation):
    scales = scaleToScaleList(scale, minScale, maxScale)

    for d in data:
        for item in d:
            if item == "VARIABLE":
                key = item
                value = VAR[d[item]]
            elif d[item][:9] == "VARIABLE:":
                key = item
                value = parseVariable(d[item][9:])
            else:
                key = item
                value = d[key]
   
            vType = type(value)

            if vType == type(dict()):
                write(item, scales, files, indentation)
                parseDict(value, scales, files, indentation)
            elif vType == type(list()):
                parseList(key, value, scales, files, indentation)
            elif vType == type(unicode()):
                write(item + " " + value, scales, files, indentation)
            elif vType == type(int()):
                write(item + " " + str(value), scales, files, indentation)

def parseVariable(value):
    var = VAR[value]
    if var[:9] == "VARIABLE:":
        var = parseVariable(var[9:])
        
    return var

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

def addIndentation(string, n):
    for i in range (0, n):
        string += " "
    return string

def substractIndentation(string, n):
    n = -n;
    return string[:n]

def write(string, scales, files, indentation):
    for value in scales:
        if re.match(r"LAYER", string, re.IGNORECASE):
            files[value].write(indentation + string + "\n")
            indentation = addIndentation(indentation, INDENTATION)
            if value == str(minimumScale(SCALES)):
                files[value].write(indentation + "MAXSCALEDENOM 999999999" + "\n")
            else:
                files[value].write(indentation + "MAXSCALEDENOM " + str(SCALES[str(int(value) -1)]) + "\n")

            files[value].write(indentation + "MINSCALEDENOM " + str(scales[value]) + "\n")
            indentation = substractIndentation(indentation, INDENTATION)
        elif re.match(r"^(NAME|MASK)", string, re.IGNORECASE):
            text = string
            text = re.sub(r"'$", value + "'", text)
            text = re.sub(r"\"$", value + "\"", text)
            files[value].write(indentation + text + "\n")
        else:
            files[value].write(indentation + string + "\n")

def comment(string):
    return re.sub(r"##",  "#", string)

def openLayerFiles(directory, scales):
    layerFiles = {}
    for value in scales:
        layerfile = codecs.open(directory + "level" + value + ".map", encoding='utf-8', mode='w+')
        layerFiles[value] = layerfile
    return layerFiles

def openMapFile(directory, name):  
    mapFile = codecs.open(directory + name + ".map", encoding='utf-8', mode="w+")
    return {"1": mapFile}

def closeFiles(files):
    for value in files:
        files[value].close()

def jsonToMap(content, outputDirectory, mapName, clean):
    global MAP, LAYERS, VAR, SCALES
    data = json.loads(content);

    MAP = data["MAP"]
    LAYERS = data["LAYERS"]
    VAR = list2dict(data["VARIABLES"])
    SCALES = list2dict(data["SCALES"])

    indentation = addIndentation("", INDENTATION)

    layerFiles = openLayerFiles(outputDirectory, SCALES)
    parseList("", LAYERS, SCALES, layerFiles, indentation, False)
    closeFiles(layerFiles)

    mapFile = openMapFile(outputDirectory, mapName)
    parseList("MAP", MAP, {"1": None}, mapFile, "")
    mapFile["1"].seek(-4, 2)
    write("#---- SYMBOLS ----#", {"1": None}, mapFile, "")
    
    for value in range(1, len(SCALES) + 1):
        if clean == True:
            write("INCLUDE 'level" + str(value) + ".map'", {"1": None}, mapFile, "")
        else:
            layerfile = codecs.open(outputDirectory + "level" + str(value) + ".map", encoding='utf-8', mode='r')
            write("#---- LEVEL " + str(value) + " ----#", {"1": None}, mapFile, "")
            write(layerfile.read(), {"1": None}, mapFile, "")
            closeFiles(layerfile)

    write("END", {"1": None}, mapFile, "")
    closeFiles(mapFile)

def string2json(string):
    #Remove the comments preceded by //
    t = re.sub(r"//.*", "", string)
    #Remove the comments between /* and */
    t = re.sub(r"/\*.*?\t*?\*/", "", t, flags=re.DOTALL)
    #Find and replace the comments preceded by ##
    comments = re.findall(r"\#\#.*", t, flags=0)
    t = re.sub(r"\#\#.*", "VOID:FLAGCOMMENT\n", t, flags=0)   
    #Replace @ with VARIABLE:
    t = re.sub(r"@", "VARIABLE:", t)
    #Find and replace the text between {{ and }} (useful for blocks like PROJECTION, METADATA, PATTERN etc.)
    texts = re.findall(r"(?<=\{\{).*?\t*?(?=\}\})", t, flags=re.DOTALL)
    t = re.sub(r"\{\{.*?\t*?\}\}", "{\nVOID:FLAGTEXT\n}", t, flags=re.DOTALL)
    #t = re.sub(r"(?<=\{{).*?\t*?(?=\}})", "\n{VOID:FLAGTEXT}\n", t, flags=re.DOTALL)
    #Find and replace values for the parameters (preceded by :)
    values = re.findall(r"(?<=:).+", t)
    t = re.sub(r"(?<=:).+", "FLAGVALUE", t)
    #Find and the parameters (followed by :)
    params = re.findall(r"\n*\s*[\w0-9\-]+\s*(?=[:\{])", t)
    t = re.sub(r"[\w0-9\-]+\s*(?=[:\{])", "FLAGPARAM", t)
    #Replace  { and } with [ and ]
    t = re.sub(r"\{", "[", t)
    t = re.sub(r"\}", "]", t)
    #Replace [ with :[
    t = re.sub(r"(?<!\()\s*\[", ":[", t)
    #Replace : with ":
    t = re.sub(r":\s*", "\":", t)
    #Replace : with :"
    t = re.sub(r"\s*:(?=\w)", ":\"", t)
    #Replace spaces followed by an alphanumeric chracter with {"
    t = re.sub(r"\s(?=\w)", "{\"", t)
    #Replace line break with \""},\n
    t = re.sub(r"\"[\s\n]+", "\\\"\"},\n", t)
    #Replace spaces preceded by alphanumeric characters or _ with "},\n
    t = re.sub(r"(?<=[a-zA-Z_])\s", "\"},\n", t)    
    #Replace , followed by a ine break and ] with ]
    t = re.sub(r",\s+\n*\]", "]", t)    
    #Replace ] not preceded by and alphanueric chracter with ]}
    t = re.sub(r"(?<!\w)\]", "]}", t) 
    #Substitute the FLAGVALUE with the corresponding values
    for i in range (0, len(values)):
        value = re.sub(r"\"", re.escape("\\") + "\"", values[i].strip())
        t = re.sub(r"FLAGVALUE", value, t, 1)
    #Substitute the FLAGPARAM with the corresponding values    
    for i in range (0, len(params)):
        param = re.sub(r"\"", re.escape("\\") + "\"", params[i].strip())
        t = re.sub(r"FLAGPARAM", param, t, 1)
    #Substitute the FLAGTEXT with "}{"VOID:":" and the corresponding texts
    for i in range (0, len(texts)):
        text = re.sub(r"\"", re.escape("\\") + "\"", texts[i].strip())
        text = re.sub(r"\n", "\"}{\"VOID\":\"", text)
        t = re.sub(r"FLAGTEXT", text, t, 1)
    #Substitute the FLAGCOMMENT with the corresponding comment blocks. Each line of the comment block is preceded with ##  
    for i in range (0, len(comments)):
        comment = re.sub(r"\"", re.escape("\\") + "\"", comments[i].strip())
        t = re.sub(r"FLAGCOMMENT",  comment, t, 1)
    #Make the JSON valid with some {},[]. SCALES has to be the first element in the file to be converted into a JSON.
    t = re.sub(r"\}\s*\n*\{", "},{", t)
    t = re.sub(r"\}\n*\s*\]\},\{\"LAYERS\"", "}],\"LAYERS\"", t)
    t = re.sub(r"\}\n*\s*\]\},\{\"MAP\"", "}],\"MAP\"", t)
    t = re.sub(r"\}\n*\s*\]\},\{\"VARIABLES\"", "}],\"VARIABLES\"", t)
    t = re.sub(r"^\s*\n*{\"", "", t)
    #Replace the - between scales values with :
    t = re.sub(r"(?<=[0-9])-(?=[0-9])", ":", t)
    #Add {" before scale levels tag
    t = re.sub(r"\s(?=([0-9]|[0-9]{2})+\":)", "{\"", t)
    #Add {" at the beginning of the string and return a valid JSON string
    return ("{\"" + t)

def list2dict(ls):
    dc = {}
    for item in ls:
        for key in item:
            dc[key] = item[key]
    return dc

def main():
    global INDENTATION
    inputDirectory = "./"
    outputDirectory = "./result/"
    mapName = "result"
    clean = False
    INDENTATION = 4

    try:                                
        opts, args = getopt.getopt(sys.argv[1:], "i:o:n:ct:", ["input", "output", "name", "clean", "tabulation"])
    except getopt.GetoptError as err:
        print str(err)                      
        sys.exit(2) 
                    
    for opt, arg in opts:
        if opt in ("-i", "--input"):
            inputDirectory = arg
        elif opt in ('-o', "--ouput"):
            outputDirectory = arg     
        elif opt in ("-n", "--name"):
            mapName = arg
        elif opt in ("-c", "--clean"):
            clean = True
        elif opt in ("-t", "--tabulation"):
            INDENTATION = int(arg)
            
    if os.path.isfile(inputDirectory + "scales"):
        inputScalesFile = codecs.open(inputDirectory + "scales", encoding='utf-8')
        inputScalesContent = inputScalesFile.read()
        inputScalesFile.close()
    else:
        print "File 'scales' not found."

    if os.path.isfile(inputDirectory + "variables"):
        inputVariablesFile = codecs.open(inputDirectory + "variables", encoding='utf-8')
        inputVariablesContent = inputVariablesFile.read()
        inputVariablesFile.close()
    else:
        print "File 'variables' not found."

    if os.path.isfile(inputDirectory + "map"):
        inputMapFile = codecs.open(inputDirectory + "map", encoding='utf-8')
        inputMapContent = inputMapFile.read()
        inputMapFile.close()
    else:
        print "File 'map' not found."
   
    if os.path.isfile(inputDirectory + "map"):
        inputMapFile = codecs.open(inputDirectory + "map", encoding='utf-8')
        inputMapContent = inputMapFile.read()
        inputMapFile.close()
    else:
        print "File 'map' not found."

    if os.path.isfile(inputDirectory + "layers"):
        inputLayersFile = codecs.open(inputDirectory + "layers", encoding='utf8')
        inputLayersContent = inputLayersFile.read()
        inputLayersFile.close()
    else:
        print "File 'layers' not found."

    if ("inputScalesContent" in locals() and "inputVariablesContent" in locals() and "inputMapContent" in locals() and "inputLayersContent" in locals()):
       jsonInput = inputScalesContent + "\n" + inputVariablesContent + "\n" + inputMapContent + "\n" + inputLayersContent;
       jsonContent = string2json(jsonInput);
               
       jsonFile = open(inputDirectory + "mapTemp.json", "w+")
       jsonFile.write(jsonContent)
       jsonFile.close()

       jsonToMap(jsonContent, outputDirectory, mapName, clean)
       
    else:
        sys.exit(2)

if __name__ == "__main__":
    main()
    
