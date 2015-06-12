#!/usr/bin/python
# -*- coding: iso-8859-1 -*-

import json
import subprocess
import re
import getopt, sys, traceback
import os.path
import codecs

"""
This script parses files with the scribe syntax, transform them
into a single json file and then into mapfiles. Read the
README for more information on the scribe syntax.

Author : Charles-Éric Bourget
Updated: 21/06/2013
"""

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
            elif len(item) > 1:
                if d[item][:9] == "VARIABLE:":
                    key = item
                    value = parseVariable(d[item][9:])
                else:
                    key = item
                    value = d[key]   
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
    if re.match(r"[0-9]{1,2}\-{1}[0-9]{1,2}", scale):
        s1 = int(re.search('(?<!\-)\w+', scale).group(0))
        s2 = int(re.search('(?<=\-)\w+', scale).group(0))
        for i in range(s1, s2 + 1):
            if (i >= minScale) and (i <= maxScale):
                scales[str(i)] = SCALES[str(i)]
                
    elif re.match(r"[0-9]+", scale):
        if (int(scale) >= minScale) and (int(scale) <= maxScale): 
            scales[scale] = SCALES[scale]

    return scales


def isScale(string):
    if re.match(r"[0-9]+(\:[0-9]+)*", string):
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
    n = -n
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
            text = re.sub(r"'$", '_' + value + "'", text)
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
    data = json.loads(content)

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
    t = re.sub(ur'("(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'|(?:[^/\n"\']|/[^/*\n"\'])+|\n)|(/\*  (?:[^*]|\*[^/])*\*/)|(?://(.*)$)$', lambda m: m.group(1), string, flags=re.MULTILINE)
    #Remove the comments between /* and */
    t = re.sub(r"/\*.*?\t*?\*/", "", t, flags=re.DOTALL)
    #Find and replace the comments preceded by ##
    comments = re.findall(r"\#\#.*", t, flags=0)
    t = re.sub(r"\#\#.*", "VOID:FLAGCOMMENT\n", t, flags=0)
    #Remove tabs
    t = re.sub(r"\t", " ", t) 
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
    #Replace spaces preceded by alphabetic characters or _ with "},\n
    t = re.sub(r"(?<=[a-zA-Z_])\s", "\"},\n", t)    
    #Replace , followed by a ine break and ] with ]
    t = re.sub(r",\s+\n*\]", "]", t)    
    #Replace ] not preceded by and alphanumeric chracter with ]}
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
    #Add {" before scale levels tag
    t = re.sub(r"\s(?=([0-9]|[0-9]{2})+\":)", "{\"", t)
    #Add {" at the beginning of the string and return a valid JSON string
    return ("{\"" + t)


def validateInput(scales, variables, map, groups):
    items = [scales, variables, map] + groups
    correct = True
    for item in items:
        (errors, line_errors) = validateSyntax(content=item["content"], name=item["name"], variables=variables["content"])
        if len(errors) > 0 or len(line_errors) > 0:
            correct = False

        for error in errors:
            print >> sys.stderr, error

        for line in sorted(line_errors.iterkeys()):
            for error in line_errors[line]:
                print >> sys.stderr, error["text"]
                print >> sys.stderr, error["value"]

    return correct


def validateSyntax(content, name, variables=None):
    lines = content.split("\n")
    line_errors = {}
    errors = []

    #Remove the comments preceded by //
    uncommented_string = re.sub(r"//.*", "", content)
    #Remove the comments between /* and */
    uncommented_string = re.sub(r"/\*.*?\t*?\*/", "", uncommented_string, flags=re.DOTALL)
    #Find and replace the comments preceded by ##
    uncommented_string = re.sub(r"\#\#.*", "", uncommented_string, flags=0)
    #Remove the the plain text between {{}}
    no_plain_text_string = re.sub(r"\{\{.*?\t*?\}\}", "{}", uncommented_string, flags=re.DOTALL)

    #Unmatching brackets
    test_string = re.sub(r"(?<=:)\s*(\"|\'|\/)+.*(\"|\'|\/)+", "FLAG:", uncommented_string)
    if not(matchingBrackets(test_string)):
        errors.append("Error : Brackets mismatch in file " + name)

    if len(errors) == 0:    
        #Missing ":"
        #Remove the values preceded with :
        test_string = re.sub(r"(?<=:).+", "FLAG:", no_plain_text_string)

        missing_dots = re.findall(r"([\w\-]+\s+(?!\:)[\w\"\'\[\/@\-\.#=]{1}.*?\n)+?", test_string)
        for value in list(set(missing_dots)):
            value = value.strip()
            for index, line in enumerate(lines):
                line = line.strip()
                if re.search(value, line):
                    str_line_number = str(index + 1)
                    if not str_line_number in line_errors:
                        line_errors[str_line_number] = []

                    line_errors[str_line_number].append({
                        "text": "Error : Missing ':' in file " + name + " on line " + str_line_number + " :",
                        "value": line        
                    })

        #Unexpected ":"
        unexpected_dots = re.findall(r"(\:\s*\{|\{\s*\:)", no_plain_text_string)
        unexpected_dots += re.findall(r"\w+\s*\:\s*\n+\s*\{", no_plain_text_string)
        for value in list(set(unexpected_dots)):
            value = value.strip()
            for index, line in enumerate(lines):
                line = line.strip()
                if re.search(value, line):
                    str_line_number = str(index + 1)
                    if not str_line_number in line_errors:
                        line_errors[str_line_number] = []

                    line_errors[str_line_number].append({
                        "text": "Error : Unexpected ':' in file " + name + " on line " + str_line_number + " :",
                        "value": line        
                    })

        unexpected_dots2 = re.findall(r"\w+\s*\:\s*\n+\s*\{", no_plain_text_string)
        for value in list(set(unexpected_dots2)):
            value = value.split("\n")[0].strip()
            for index, line in enumerate(lines):
                line = line.strip()
                if re.search(value, line):
                    str_line_number = str(index + 1)
                    if not str_line_number in line_errors:
                        line_errors[str_line_number] = []

                    line_errors[str_line_number].append({
                        "text": "Error : Unexpected ':' in file " + name + " on line " + str_line_number + " :",
                        "value": line        
                    })
        
        #Unexpected plain text
        test_string = re.sub(r"epsg\:", "epsg$", no_plain_text_string, flags=re.IGNORECASE)
        no_plain_text_lines = test_string.split("\n")
        for  no_plain_text_line in no_plain_text_lines:
            no_plain_text_line = no_plain_text_line.strip()

            if no_plain_text_line != "" and (not(re.search(r"(\:|\{|\}|@)", no_plain_text_line)) and re.search(r"^(\"|\'|[0-9]).+(\"|\'|[0-9])$", no_plain_text_line)):
                for index, line in enumerate(lines):
                    line = line.strip()
                    no_plain_text_line = re.sub(r"epsg\$", "epsg:", no_plain_text_line, flags=re.IGNORECASE)
                    if re.search(no_plain_text_line, line, flags=re.IGNORECASE):
                        str_line_number = str(index + 1)
                        if not str_line_number in line_errors:
                            line_errors[str_line_number] = []

                        line_errors[str_line_number].append({
                            "text": "Error : Malformed text in file " + name + " on line " + str_line_number + \
                            ". Consider using double brackets {{ }} :",
                            "value": line        
                        })
        
        unexpected_plain_text = re.findall(r"(\:\s*\{|\{\s*\:)", no_plain_text_string)

        #Call to undefined variable
        vars = re.findall(r"(?<=@).+", uncommented_string)
        for var in vars:
            var_re = re.compile("(?<!\w)" + var + "\s*(\:|\{)+")
            #var_re = re.compile(var)
            if not(var_re.search(variables)):
                for index, line in enumerate(lines):
                    line = line.strip()
                    if re.search(var, line):
                        str_line_number = str(index + 1)
                        if not str_line_number in line_errors:
                            line_errors[str_line_number] = []

                        line_errors[str_line_number].append({
                            "text": "Error : Call to undefined variable in file " + name + " on line " + str_line_number + " :",
                            "value": line        
                        })

    return (errors, line_errors)


def matchingBrackets(string):
    iparens = iter('{}')
    parens = dict(zip(iparens, iparens))
    closing = parens.values()
    line = 1
    stack = []
    for c in string:
        d = parens.get(c, None)
        if d:
            stack.append(d)
        elif c in closing:
            if not stack or c != stack.pop():
                return False
    return not stack


def list2dict(ls):
    dc = {}
    for item in ls:
        for key in item:
            dc[key] = item[key]
    return dc

def debugMapfile(outputDirectory, mapName, level):
    sub = subprocess.Popen('shp2img -m ' + outputDirectory + mapName + '.map -all_debug ' + str(level) + ' -o ' + outputDirectory + ' debug.png', shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE) 
    logs = 'Mapserver logs (debug level ' + str(level) + ')\n'
    logs += '------------------------------\n'
    logs += sub.stderr.read().strip() + sub.stdout.read().strip()
    print >> sys.stdout, logs
    return

def main():
    global INDENTATION
    INDENTATION = 4

    inputDirectory = "./"
    outputDirectory = "./result/"
    mapName = "result" 
    configFile = "config"
    clean = False
    error = ""
    outputJSONFile = None
    debugLevel = -1

    try:                                
        opts, args = getopt.getopt(sys.argv[1:], "i:o:n:cf:t:j:d:", ["input", "output", "name", "clean", "file","tabulation", "json", "debug"])
    except getopt.GetoptError as err:
        print >> sys.stderr, str(err)                      
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
        elif opt in ("-f", "--file"):
            configFile = arg
        elif opt in ("-t", "--tabulation"):
            INDENTATION = int(arg)
        elif opt in ("-j", "--json"):
            outputJSONFile = arg
        elif opt in ("-d", "--debug"):
            debugLevel = int(arg)
            
    if os.path.isfile(inputDirectory + "scales"):
        inputScalesFile = codecs.open(inputDirectory + "scales", encoding='utf-8')
        inputScalesContent = inputScalesFile.read()
        scales = {"name": inputDirectory + "scales", "content": inputScalesContent}
        inputScalesFile.close()
    else:
        error += "File 'scales' not found.\n"

    if os.path.isfile(inputDirectory + "variables"):
        inputVariablesFile = codecs.open(inputDirectory + "variables", encoding='utf-8')
        inputVariablesContent = inputVariablesFile.read()
        variables = {"name": inputDirectory + "variables", "content": inputVariablesContent}
        inputVariablesFile.close()
    else:
        error += "File 'variables' not found.\n"

    if os.path.isfile(inputDirectory + "map"):
        inputMapFile = codecs.open(inputDirectory + "map", encoding='utf-8')
        inputMapContent = inputMapFile.read()
        map = {"name": inputDirectory + "map", "content": inputMapContent}
        inputMapFile.close()
    else:
        error += "File 'map' not found.\n"

    if os.path.isfile(configFile):
        inputConfigFile = codecs.open(configFile, encoding='utf8')
        inputConfigContent = inputConfigFile.read()
        inputConfigFile.close()

        jsonConfig = json.loads(string2json(inputConfigContent))
        inputLayersContent = "LAYERS {\n"
        groupFiles = [""] * (len(jsonConfig["ORDER"]) + 1)
        groups= []
        
        for i in range(0, len(jsonConfig["ORDER"])):
            for j in jsonConfig["ORDER"][i]:
                if jsonConfig["ORDER"][i][j][:1] == "/":
                    layerFilePath = jsonConfig["ORDER"][i][j]
                else:
                    layerFilePath = inputDirectory + jsonConfig["ORDER"][i][j]

                if (os.path.isfile(layerFilePath)):
                    if (int(j) > 0 and int(j) <= len(jsonConfig["ORDER"])):
                        groupFiles[int(j)] = layerFilePath
                    else:
                        error += "Index " + j + " out of bounds in config file.\n" 
                else:
                    error += "File '" +  layerFilePath + "' not found.\n"

        for i in range(0, len(groupFiles)):
            if (os.path.isfile(groupFiles[i])):
                inputLayerFile = codecs.open(groupFiles[i], encoding='utf8')
                inputLayerContent = inputLayerFile.read()
                inputLayersContent += inputLayerContent + "\n"
                groups.append({"name": groupFiles[i], "content": inputLayerContent})
                inputLayerFile.close()

        inputLayersContent += "\n}"
    else:
        error += "Config file not found.\n"

    if (error == ""):
        jsonInput = inputScalesContent + "\n" + inputVariablesContent + "\n" + inputMapContent + "\n" + inputLayersContent
        correct = validateInput(scales=scales, variables=variables, map=map, groups=groups)
        if correct == True:
            jsonContent = string2json(jsonInput)
            if outputJSONFile is not None:
                jFile = codecs.open(outputJSONFile, encoding='utf-8', mode="w+")
                jFile.write(jsonContent.encode('utf-8'))
                
            try:
                jsonToMap(jsonContent, outputDirectory, mapName, clean)
                if debugLevel >= 0 and debugLevel <= 5: #debug using shp2img
                    debugMapfile(outputDirectory, mapName, debugLevel)
            except ValueError:
                exc_traceback = sys.exc_info()[2]
                print >> sys.stderr, "Uncatched syntax error :"
                traceback.print_exc(exc_traceback)
    else:
        print >> sys.stderr, error
        sys.exit(2)
        

if __name__ == "__main__":
    main()
    
