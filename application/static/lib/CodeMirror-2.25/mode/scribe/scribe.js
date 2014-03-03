CodeMirror.defineMode("scribe", function(config, parserConfig) {
  var indentUnit = config.indentUnit,
      keywords = parserConfig.keywords || {},
      blockKeywords = parserConfig.blockKeywords || {},
      multiLineStrings = parserConfig.multiLineStrings;
  var isOperatorChar = /[+\-*&%=<>!?|\/]/;

  var curPunc;

  function tokenBase(stream, state) {
    var ch = stream.next();
    if (ch == '"' || ch == "'") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    }
    if (/[\[\]{}\(\),;\:\.]/.test(ch)) {
      curPunc = ch;
      return null;
    }
    if (/\d/.test(ch)) {
      stream.eatWhile(/[\w\.]/);
      return "number";
    }
    if (ch == "/") {
      if (stream.eat("*")) {
        state.tokenize = tokenComment;
        return tokenComment(stream, state);
      }
      if (stream.eat("/")) {
        stream.skipToEnd();
        return "comment";
      }
    }
    /*---*/
    if (ch == "#") {
      if (stream.eat("#")) {
        stream.skipToEnd();
        return "comment";
      }
    }
    if (ch == "@") {
      stream.eatWhile(/[\w\.]/);
      return "variable";
    }
    /*----*/
    if (isOperatorChar.test(ch)) {
      stream.eatWhile(isOperatorChar);
      return "operator";
    }
    stream.eatWhile(/[\w\$_]/);
    var cur = stream.current().toUpperCase();
    if (keywords.propertyIsEnumerable(cur)) {
      if (blockKeywords.propertyIsEnumerable(cur)) curPunc = "newstatement";
      return "keyword";
    }
    return "word";
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, next, end = false;
      while ((next = stream.next()) != null) {
        if (next == quote && !escaped) {end = true; break;}
        escaped = !escaped && next == "\\";
      }
      if (end || !(escaped || multiLineStrings))
        state.tokenize = null;
      return "string";
    };
  }

  function tokenComment(stream, state) {
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "/" && maybeEnd) {
        state.tokenize = null;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return "comment";
  }

  function Context(indented, column, type, align, prev) {
    this.indented = indented;
    this.column = column;
    this.type = type;
    this.align = align;
    this.prev = prev;
  }
  function pushContext(state, col, type) {
    return state.context = new Context(state.indented, col, type, null, state.context);
  }
  function popContext(state) {
    var t = state.context.type;
    if (t == ")" || t == "]" || t == "}")
      state.indented = state.context.indented;
    return state.context = state.context.prev;
  }

  // Interface

  return {
    startState: function(basecolumn) {
      return {
        tokenize: null,
        context: new Context((basecolumn || 0) - indentUnit, 0, "top", false),
        indented: 0,
        startOfLine: true
      };
    },

    token: function(stream, state) {
      var ctx = state.context;
      if (stream.sol()) {
        if (ctx.align == null) ctx.align = false;
        state.indented = stream.indentation();
        state.startOfLine = true;
      }
      if (stream.eatSpace()) return null;
      curPunc = null;
      var style = (state.tokenize || tokenBase)(stream, state);
      if (style == "comment" || style == "meta") return style;
      if (ctx.align == null) ctx.align = true;

      if ((curPunc == ";" || curPunc == ":") && ctx.type == "statement") popContext(state);
      else if (curPunc == "{") pushContext(state, stream.column(), "}");
      else if (curPunc == "[") pushContext(state, stream.column(), "]");
      else if (curPunc == "(") pushContext(state, stream.column(), ")");
      else if (curPunc == "}") {
        while (ctx.type == "statement") ctx = popContext(state);
        if (ctx.type == "}") ctx = popContext(state);
        while (ctx.type == "statement") ctx = popContext(state);
      }
      else if (curPunc == ctx.type) popContext(state);
      else if (ctx.type == "}" || ctx.type == "top" || (ctx.type == "statement" && curPunc == "newstatement"))
        pushContext(state, stream.column(), "statement");
      state.startOfLine = false;
      return style;
    },

    indent: function(state, textAfter) {
      if (state.tokenize != tokenBase && state.tokenize != null) return 0;
      var ctx = state.context, firstChar = textAfter && textAfter.charAt(0);
      if (ctx.type == "statement" && firstChar == "}") ctx = ctx.prev;
      var closing = firstChar == ctx.type;
      if (ctx.type == "statement") return ctx.indented + (firstChar == "{" ? 0 : indentUnit);
      else if (ctx.align) return ctx.column + (closing ? 0 : 1);
      else return ctx.indented + (closing ? 0 : indentUnit);
    },

    electricChars: "{}"
  };
});

(function() {
  function words(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }
  var cKeywords = "CLASS END FEATURE JOIN LABEL LAYER LEADER LEGEND MAP METADATA OUTPUTFORMAT PATTERN POINTS PROJECTION QUERYMAP REFERENCE SCALEBAR STYLE SYMBOL VALIDATION WEB \
  ALIGN ALPHACOLOR ANCHORPOINT ANGLE \
  BACKGROUNDCOLOR BUFFER \
  CENTER CHARACTER CLASSGROUP CLASSITEM COLOR COLORRANGE CONFIG CONNECTION CONNECTIONTYPE \
  DATA DATAPATTERN DATARANGE DEBUG DEFRESOLUTION DRIVER \
  EMPTY ENCODING ERROR EXPRESSION EXTENSION EXTENT \
  FILLED FILTER FILTERITEM FONT FONTSET FOOTER FORCE FORMATOPTION FROM \
  GAP GEOMTRANSFORM GRATICULE GRID GRIDSTEP GROUP HEADER \
  IMAGE IMAGECOLOR IMAGEMODE IMAGEPATH IMAGEQUALITY IMAGETYPE IMAGEURL INCLUDE INDEX INITIALGAP INTERVALS ITEMS \
  KEYIMAGE KEYSIZE KEYSPACING \
  LABELCACHE_MAP_EDGE_BUFFER LABELCACHE LABELFORMAT LABELITEM LABELMAXSCALEDENOM LABELMINSCALEDENOM LABELREQUIRES LABELSIZEITEM LATLON LINECAP LINEJOIN LINEJOINMAXSIZE LOG \
  MARKER MARKERSIZE MASK MAXARCS MAXBOXSIZE MAXDISTANCE MAXFEATURES MAXINTERVAL MAXLENGTH MAXOVERLAPANGLE MAXSCALE MAXSCALEDENOM MAXSIZE MAXSUBDIVIDE MAXTEMPLATE MAXWIDTH MIMETYPE \
  MINARCS MINBOXSIZE MINDISTANCE MINFEATURESIZE MININTERVAL MINSCALE MINSCALEDENOM MINSIZE MINSUBDIVIDE MINTEMPLATE MINWIDTH \
  NAME \
  OFFSET OFFSITE OPACITY OUTLINECOLOR OUTLINEWIDTH \
  PARTIALS POLAROFFSET POSITION POSTLABELCACHE PRIORITY PROCESSING \
  QUERYFORMAT \
  REPEATDISTANCE REQUIRES RESOLUTION \
  SCALE SHADOWCOLOR SHADOWSIZE SHAPEPATH SIZE SIZEUNITS STATUS STYLEITEM SYMBOLSCALE SYMBOLSCALEDENOM SYMBOLSET \
  TABLE TEMPLATE TEMPLATEPATTERN TEXT TILEINDEX TILEITEM TITLE TO TOLERANCE TOLERANCEUNITS TRANSFORM TRANSPAREN[T] TYPE \
  UNITS WIDTH WRAP";

  // C#-style strings where "" escapes a quote.
  function tokenAtString(stream, state) {
    var next;
    while ((next = stream.next()) != null) {
      if (next == '"' && !stream.eat('"')) {
        state.tokenize = null;
        break;
      }
    }
    return "string";
  }

  CodeMirror.defineMIME("scribe", {
    name: "scribe",
    keywords: words(cKeywords)
  });
}());
