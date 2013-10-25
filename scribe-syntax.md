---
title: ScribeUI - Getting started with Scribe syntax
layout: default
---

# Getting started with Scribe syntax

Creating a nice looking map that delivers efficiently its message is not an easy task. Quite often we are dealing with large datasets that shouldn’t be displayed at all scale levels or that should be displayed, but, with a style that changes with the scale level. Every single detail is important when defining the style of a map. The process is generally an iterative one and requires a lot of modifications to be made at each scale levels.

With MapServer, MINSCALEDENOM and MAXSCALEDENOM tags in the LAYER and CLASS objects are responsible for the scale management. That means that as soon as an element of the style changes for a given LAYER or CLASS at a given scale level, a new LAYER or CLASS needs to be created. That way, we end up rewriting a lot of text to modify only a single parameter. The task becomes more tedious if a given parameter (the color of a road for example) is defined within 16 different LAYERs or so.

That’s where Scribe comes to the rescue. It is a converter tool written in python that we developed to facilitate the creation of ‘mapfiles’ by allowing for the use of variables as well as shortcuts for managing scale levels. This approach is similar to that of [Basemaps](https://github.com/mapserver/basemaps/) but simpler to use and generally less verbose.

## Scale Management

	LAYER {
	    1-16 {
		NAME: 'land'
		TYPE: POLYGON
		@layerconfig
		DATA {
		    1-4: '110m_physical/ne_110m_land'
		    5-10: '50m_physical/ne_50m_land'
		    11-16: '10m_physical/ne_10m_land'
		}
		CLASS {
		    STYLE {
			COLOR {
			    1-6: '#EEECDF'
			    7-16: '#AAA89B'
			}
			OUTLINECOLOR: 200 200 200
			OUTLINEWIDTH: @land_ol_width
		    }
		}
	    }
	}

In the above example, a LAYER named ‘land’ is created. With the ‘1-16’ tag, this LAYER will be displayed from scale level 1 to 16. Scribe converts automatically those levels in terms of MINSCALEDENOM and MAXSCALEDENOM. Furthermore, from level 1 to 4, the data (DATA) has a resolution of 110m. From 5 to 10, it has a resolution of 50m and from 11 to 16 it has a resolution of 10m. The color (COLOR) changes according to the scale level too. Using this syntax makes it very easy to modify a given parameter for one or more scale levels without having to rewrite or copy and paste a load of text and having to make changes to a bunch of places.

## Defining and using variables

Not only Scribe facilitates scale management, it also allows for defining and using variables. In the previous example, the variables ‘layerconfig’ and ‘land_ol_width’ are called with a ‘@’. Those variables are defined in the following way:

	VARIABLES {
	    layerconfig {
		GROUP: 'default'
		STATUS: ON
		PROJECTION {\{
		    'init=epsg:4326'
		}\}
		PROCESSING: 'LABEL_NO_CLIP=ON'
		PROCESSING: 'CLOSE_CONNECTION=DEFER'
	    }
	    land_ol_width: 1
	}

The variable ‘layerconfig’ contains some parameters that are used in the definition of most LAYERs. That means for each LAYER, writing ‘@layerconfig’ outputs all the parameters contained in the variable and spares the writing of a few lines of text. The next variable ‘land_ol_width’ contains a single value.

Note that in the definition of the ‘layerconfig’ variable, the PROJECTION tag is followed with two ‘{‘. This syntax is necessary for tags like PROJECTION, METADATA AND PATTERN which contain no parameter, only plain text.

## Comment Blocks

	LAYER {
	    1-16 {
		NAME: 'land'
		TYPE: POLYGON
		@layerconfig
		DATA {
		    1-4: '110m_physical/ne_110m_land'
		    5-10: '50m_physical/ne_50m_land'
		    11-16: '10m_physical/ne_10m_land'
		}
		CLASS {
		    STYLE {
			COLOR {
			    1-6: '#EEECDF'
			    7-16: '#AAA89B'
			}
			##Comments preceded with ## appear
			##in the resulting mapfile.
			##Comment blocks between /* */
			## do not appear in the resulting mapfile.
			/* 
			OUTLINECOLOR: 200 200 200
			OUTLINEWIDTH: @land_ol_width
			*/              
		    }
		}
	    }
	}

## Using Scribe

Scribe is fully supported by ScribeUI, but it can also be used as an independant component. To learn more about that, [visit the Scribe github repository](https://github.com/solutionsmapgears/Scribe).

