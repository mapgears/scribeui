layer_suffixes = {
   0:0,
   1:1,
   2:2,
   3:3,
   4:4,
   5:5,
   6:6,
   7:7,
   8:8,
   9:9,
   10:10,
   11:11,
   12:12,
   13:13,
   14:14,
   15:15,
   16:16
}

maxscales = {
   0:99999999999,
   1:268435456,
   2:134217728,
   3:67108864,
   4:33554432,
   5:16777216,
   6:8388608,
   7:4194304,
   8:2097152,
   9:1048576,
   10:524288,
   11:262144,
   12:131072,
   13:65536,
   14:32768,
   15:16384,
   16:8192
}

minscales = {
   0:268435456,
   1:134217728,
   2:67108864,
   3:33554432,
   4:16777216,
   5:8388608,
   6:4194304,
   7:2097152,
   8:1048576,
   9:524288,
   10:262144,
   11:131072,
   12:65536,
   13:32768,
   14:16384,
   15:8192,
   16:0
}

vars = {
    'layer_suffix':layer_suffixes,
    'maxscale':maxscales,
    'minscale':minscales,
    'db_connection': '"host=pg1.mapgears.com dbname=osmna user=osmna password=osmna port=5432"',

    #=============================#
    #           land              #
    #=============================#
    'land_data': {
        0:'"data/TM_WORLD_BORDERS-0.3.shp"',
        3:'"data/shoreline_300"',
        7:'"data/processed_p"'
    },
    'land_epsg': {
        0:'"+init=epsg:4326"',
        3:'"+init=epsg:900913"',
    },
    'land_clr': '"#F4F3F0"',
   
    #=============================#
    #          Borders            #
    #=============================# 
    #Admin
    'admin_data': {
        0: '"geometry from (select geometry,osm_id,OSM_NAME_COLUMN as name,admin_level from OSM_PREFIX_admin where admin_level = 4) as foo using unique osm_id using srid=OSM_SRID"'
    },
    'admin_epsg': {
        0:'"+init=epsg:900913"'
    },
    'display_admin': {
        0:0,
        2:1
    },
    
    'admin_clr': {
        0:'"#E8E6E1"',
        3:'"#9D9D9D"'
     },
    'admin_width': {
        0:0.7,
        4:0.9
    },
    
    'display_admin_style_pattern': {
        0:0,
        3:1
    },
    'admin_style_pattern': {
      0: '5.0 5.0'
    },
	
	#Border
    'border_data': '"data/boundaries.shp"',
    'border_epsg': {
        0: '"+init=epsg:4326"'
    },
	
	#border_2
    'display_border_2': {
        0:1
    },
    'display_border_2_outer': {
        0:0,
        6:1
    },
    'border_2_clr': {
        0:'"#CDCBC6"'
    },
    'border_2_width': {
        0:'5'
    },
    'border_2_inner_clr': {
        0:'"#CDCBC6"',
        4:'"#8d8b8d"'
    },
    'border_2_inner_width': {
        0:'1'
    },
    'border_2_opacity': '50',

 	#border_4   
    'display_border_4': {
        0:0
    },
    'display_border_4_outer': {
        0:0
    },
    'border_4_clr': {
        0:'"#CDCBC6"'
    },
    'border_4_width': {
        0:'5'
    },
    'border_4_inner_clr': {
        0:'"#CDCBC6"',
        4:'"#8d8b8d"'
    },
    'border_4_inner_width': {
        0:'1'
    },
    'border_4_opacity': '50',

    #border_6
    'display_border_6': {
        0:0
    },
    'display_border_6_outer': {
        0:0
    },
    'border_6_clr': {
        0:'"#CDCBC6"'
    },
    'border_6_width': {
        0:'5'
    },
    'border_6_inner_clr': {
        0:'"#CDCBC6"',
        4:'"#8d8b8d"'
    },
    'border_6_inner_width': {
        0:'1'
    },
    'border_6_opacity': '50',

    #border_8
    'display_border_8': {
        0:0
    },
    'display_border_8_outer': {
        0:0
    },
    'border_8_clr': {
        0:'"#CDCBC6"'
    },
    'border_8_width': {
        0:'5'
    },
    'border_8_inner_clr': {
        0:'"#CDCBC6"',
        4:'"#8d8b8d"'
    },
    'border_8_inner_width': {
        0:'1'
    },
    'border_8_opacity': '50',

    #=============================#
    #         landusage           #
    #=============================#   
    'landusage_data': {
      	 0:'"geometry from (select geometry ,osm_id, type, OSM_NAME_COLUMN as name from OSM_PREFIX_landusages_gen0 \
      		where type in (\'forest\',\'residential\')\
      		order by area desc) as foo using unique osm_id using srid=OSM_SRID"',
      	 3:'"geometry from (select geometry ,osm_id, type, OSM_NAME_COLUMN as name from OSM_PREFIX_landusages_gen0 \
      		where type in (\'forest\',\'industrial\',\'commercial\',\'residential\',\'park\', \'nature_reserve\')\
      		order by area desc) as foo using unique osm_id using srid=OSM_SRID"',
      	 9:'"geometry from (select geometry ,osm_id, type, OSM_NAME_COLUMN as name from OSM_PREFIX_landusages_gen1 \
      		where type in (\'forest\',\'pedestrian\',\'cemetery\',\'industrial\',\'commercial\',\
      		\'brownfield\',\'residential\',\'school\',\'college\',\'university\',\
      		\'military\',\'park\',\'golf_course\',\'hospital\',\'parking\',\'stadium\',\'sports_center\',\
      		\'pitch\', \'nature_reserve\') order by area desc) as foo using unique osm_id using srid=OSM_SRID"',
      	 12:'"geometry from (select geometry ,osm_id, type, OSM_NAME_COLUMN as name from OSM_PREFIX_landusages \
      		where type in (\'forest\',\'pedestrian\',\'cemetery\',\'industrial\',\'commercial\',\
      		\'brownfield\',\'residential\',\'school\',\'college\',\'university\',\
      		\'military\',\'park\',\'golf_course\',\'hospital\',\'parking\',\'stadium\',\'sports_center\',\
      		\'pitch\', \'nature_reserve\') order by area desc) as foo using unique osm_id using srid=OSM_SRID"'
    },
    
    'display_landusage': {
        0:1
    },

    'industrial_clr': '"#d1d1d1"',
    'label_industrial' : {0:0, 11:1},
    'industrial_font': "sc",
    'industrial_lbl_size': 8,
    'industrial_lbl_clr': '0 0 0',
    'industrial_lbl_ol_clr': "255 255 255",
    'industrial_lbl_ol_width': 2,
    'industrial_lbl_priority': 2,
    
    'commercial_clr': '"#d1d1d1"',
    'label_commercial' : {0:0, 11:1},
    'commercial_font': "sc",
    'commercial_lbl_size': 8,
    'commercial_lbl_clr': '0 0 0',
    'commercial_lbl_ol_clr': "255 255 255",
    'commercial_lbl_ol_width': 2,
    'commercial_lbl_priority': 2,

    'residential_clr': '"#E3DED4"',
    'label_residential' : {0:0, 12:1},
    'residential_font': "sc",
    'residential_lbl_size': 8,
    'residential_lbl_clr': '0 0 0',
    'residential_lbl_ol_clr': "255 255 255",
    'residential_lbl_ol_width': 2,
    'residential_lbl_priority': 1,

    'forest_clr': '"#C2D1B2"',
    'label_forest' : {0:0, 12:1},
    'forest_font': "sc",
    'forest_lbl_size': 8,
    'forest_lbl_clr': '0 0 0',
    'forest_lbl_ol_clr': "255 255 255",
    'forest_lbl_ol_width': 2,
    'forest_lbl_priority': 1,

    'park_clr': '"#DCDCB4"',
    'label_park' : {0:0, 4:1},
    'park_font': "sc",
    'park_lbl_size': 8,
    'park_lbl_clr': '0 100 0',
    'park_lbl_ol_clr': "255 255 255",
    'park_lbl_ol_width': 2,
    'park_lbl_priority': 2,
    'park_lbl_position': 'lc',
    'park_lbl_offset': '0 -20',
    'park_symbol': "'symbols/forest.png'",
    'park_symbol_size': 30,
   
    'golf_clr': '"#DCDCB4"',
    'label_golf' : {0:0, 13:1},
    'golf_font': "sc",
    'golf_lbl_size': 8,
    'golf_lbl_clr': '0 100 0',
    'golf_lbl_ol_clr': "255 255 255",
    'golf_lbl_ol_width': 2,
    'golf_lbl_priority': 2,
    'golf_lbl_position': 'lc',
    'golf_lbl_offset': '0 -20',
    'golf_symbol': "'symbols/flag-golf2.png'",
    'golf_symbol_size': 20,

    'nature_reserve_clr': '"#DCDCB4"',
    'label_nature_reserve' : {0:0, 4:1},
    'nature_reserve_font': "sc",
    'nature_reserve_lbl_size': 8,
    'nature_reserve_lbl_clr': '0 100 0',
    'nature_reserve_lbl_ol_clr': "255 255 255",
    'nature_reserve_lbl_ol_width': 2,
    'nature_reserve_lbl_priority': 2,
    'nature_reserve_lbl_position': 'lc',
    'nature_reserve_lbl_offset': '0 -20',
    'nature_reserve_symbol': "'symbols/forest.png'",
    'nature_reserve_symbol_size': 30,

    'hospital_clr': '"#E6C8C3"',
    'label_hospital' : {0:0, 12:1},
    'hospital_font': "sc",
    'hospital_lbl_size': 8,
    'hospital_lbl_clr': '0 0 0',
    'hospital_lbl_ol_clr': "255 255 255",
    'hospital_lbl_ol_width': 2,
    'hospital_lbl_priority': 1,

    'education_clr': '"#DED1AB"',
    'label_education' : {0:0, 12:1},
    'education_font': "sc",
    'education_lbl_size': 8,
    'education_lbl_clr': '0 0 0',
    'education_lbl_ol_clr': "255 255 255",
    'education_lbl_ol_width': 2,
    'education_lbl_priority': 1,
    
    'sports_clr': '"#DED1AB"',
    'label_sports' : {0:0, 12:1},
    'sports_font': "sc",
    'sports_lbl_size': 8,
    'sports_lbl_clr': '0 0 0',
    'sports_lbl_ol_clr': "255 255 255",
    'sports_lbl_ol_width': 2,
    'sports_lbl_priority': 1,

    'cemetery_clr': '"#d1d1d1"',
    'label_cemetery' : {0:0, 12:1},
    'cemetery_font': "sc",
    'cemetery_lbl_size': 8,
    'cemetery_lbl_clr': '0 0 0',
    'cemetery_lbl_ol_clr': "255 255 255",
    'cemetery_lbl_ol_width': 2,
    'cemetery_lbl_priority': 2,

	#Pedestrian: See highways
	
	#Transport areas
    'transport_clr': '200 200 200',
    'transport_font': "sc",
    'transport_lbl_priority': 10,
    'transport_lbl_position': 'lc',
    'transport_lbl_offset': '0 -20',

    'label_aerodome' : {0:0, 12:1},
    'aerodome_lbl_clr': '0 0 0',
    'aerodome_lbl_size': 8,
    'aerodome_lbl_ol_clr': "255 255 255",
    'aerodome_lbl_ol_width': 2,
    'aerodome_symbol': "'symbols/airport.png'",
    'aerodome_symbol_size': 30,
    
    #Public transport
    'public_transport_data': {
         0: '"geometry from (select geometry, osm_id, type, OSM_NAME_COLUMN as name from osm_new_transport_points where type in (\'station\', \'subway_entrance\', \'terminal\', \'tram_stop\')) as foo using unique osm_id using srid=OSM_SRID"',
         16: '"geometry from (select geometry, osm_id, type, OSM_NAME_COLUMN as name from osm_new_transport_points where type in (\'bus_stop\', \'station\', \'subway_entrance\', \'terminal\', \'tram_stop\')) as foo using unique osm_id using srid=OSM_SRID"'
    },
    
    'label_public_transport' : {0:0, 14:1},
    'public_transport_lbl_size' : 8,
    'public_transport_symbol': "'transportsquare'",
    'public_transport_symbol_size' : {0:13, 16:15},
    
	'bus_lbl_text': 'B',
    'bus_lbl_clr': '0 111 239',
    'bus_symbol_clr': '255 255 255',
    'bus_symbol_ol_clr': '0 111 239',
    
    'subway_lbl_text': 'M',
    'subway_lbl_clr': '255 255 255',
    'subway_symbol_clr': '0 111 239',
    'subway_symbol_ol_clr': '255 255 255',

	'tram_lbl_text': 'T',
    'tram_lbl_clr': '255 255 255',
    'tram_symbol_clr': '0 111 239',
    'tram_symbol_ol_clr': '255 255 255',
    
    'station_lbl_text': 'T',
    'station_lbl_clr': '0 111 239',
    'station_symbol_clr': '255 255 255',
    'station_symbol_ol_clr': '0 111 239',

    'label_helipad' : {0:0, 12:1},
    'helipad_lbl_text': 'H',
    'helipad_lbl_clr': '255 255 255',
    'helipad_lbl_position': 'cc',
    'helipad_symbol_clr': '200 200 200',
    
    #Parking
    'parking_data': {
         0:'"centroid from (select ST_Centroid(geometry) as centroid, osm_id, type, OSM_NAME_COLUMN as name from OSM_PREFIX_landusages where type in (\'parking\')) as foo using unique osm_id using srid=OSM_SRID"'
    },
    'display_parking': {0:0, 16:1},
    'parking_clr': '"#AAAAAA"',
    'label_parking': {0:0, 16:1},
    'parking_font': "sc",
    'parking_lbl_text': 'P',
    'parking_lbl_size': 10,
    'parking_lbl_clr': '255 255 255',
    'parking_lbl_position': 'cc',

    #=============================#
    #            water            #
    #=============================#
    #Ocean
    'ocean_clr': '"#a5bfe0"',
    
    #Waterarea
   	'waterarea_data': {
      	  0: '"geometry from (select geometry,osm_id ,OSM_NAME_COLUMN as name,type from OSM_PREFIX_waterareas_gen0) as foo using unique osm_id using srid=OSM_SRID"',
      	  4: '"geometry from (select geometry,osm_id ,OSM_NAME_COLUMN as name,type from OSM_PREFIX_waterareas_gen1) as foo using unique osm_id using srid=OSM_SRID"',
      	  12: '"geometry from (select geometry,osm_id ,OSM_NAME_COLUMN as name,type from OSM_PREFIX_waterareas) as foo using unique osm_id using srid=OSM_SRID"'
   	},
	'display_waterarea': 1,
    
    'waterarea_clr': '"#a5bfe0"',
    'waterarea_font': "sc",
    
    'label_waterarea' : {0:0, 4:1},
    'waterarea_lbl_size': 8,
    'waterarea_lbl_clr': '"#6B94B0"',
    'waterarea_lbl_ol_clr': "255 255 255",
    'waterarea_lbl_ol_width': 2,
    
    #Waterways
    'waterways_data': {
        0:'"geometry from (select geometry, osm_id, type, OSM_NAME_COLUMN as name from OSM_PREFIX_waterways where type=\'river\') as foo using unique osm_id using srid=OSM_SRID"',
        10:'"geometry from (select geometry, osm_id, type, OSM_NAME_COLUMN as name from OSM_PREFIX_waterways) as foo using unique osm_id using srid=OSM_SRID"'
    },
    'display_waterways': {
        0:0,
        14:1
    },
    
    #River
    'river_clr': '"#B3C6D4"',
    'river_width': {
        0:0,
        14:0.3,
        15:0.5,
        16:1,
        17:2
    },
    
    'label_river' : {0:0, 6:1},
    'river_font': "sc",
    'river_lbl_size': {0:8,15:9,17:10},
    'river_lbl_clr': '"#6B94B0"',
    'river_lbl_ol_clr': "255 255 255",
    'river_lbl_ol_width': 2,

    #Canal
    'canal_clr': '"#B3C6D4"',
    'canal_width': {
        0:0,
        14:0.3,
        15:0.5,
        16:1,
        17:2
    },
    
    'label_canal' : {0:0, 10:1},
    'canal_font': "sc",
    'canal_lbl_size': 8,
    'canal_lbl_clr': '"#6B94B0"',
    'canal_lbl_ol_clr': "255 255 255",
    'canal_lbl_ol_width': 2,

    #Stream
    'stream_clr': '"#B3C6D4"',
    'stream_width': {
        0:0,
        14:0.3,
        15:0.5,
        16:1,
        17:2
    },
    
    'label_stream' : {0:0, 12:1},
    'stream_font': "sc",
    'stream_lbl_size': 8,
    'stream_lbl_clr': '"#6B94B0"',
    'stream_lbl_ol_clr': "255 255 255",
    'stream_lbl_ol_width': 2,
    
    #=============================#
    #            roads            #
    #=============================#
    'roads_data': {
          0:'"geometry from (select oneway, osm_id,geometry,OSM_NAME_COLUMN as name,ref,type,tunnel,bridge from OSM_PREFIX_roads_gen0 where type = \'motorway\' order by z_order asc, st_length(geometry) asc) as foo using unique osm_id using srid=OSM_SRID"',
          7:'"geometry from (select oneway, osm_id,geometry,OSM_NAME_COLUMN as name,ref,type,tunnel,bridge from OSM_PREFIX_roads_gen1 where type in (\'motorway\', \'trunk\') order by z_order asc, st_length(geometry) asc) as foo using unique osm_id using srid=OSM_SRID"',
          8:'"geometry from (select oneway, osm_id,geometry,OSM_NAME_COLUMN as name,ref,type,tunnel,bridge from OSM_PREFIX_roads_gen1 where type in (\'motorway\', \'motorway_link\', \'trunk\', \'trunk_link\', \'primary\', \'secondary\', \'tertiary\', \'residential\', \'road\', \'living_street\',  \'track\', \'footway\', \'pedestrian\') order by z_order asc, st_length(geometry) asc) as foo using unique osm_id using srid=OSM_SRID"',
          10:'"geometry from (select oneway, osm_id,geometry,OSM_NAME_COLUMN as name,ref,type,tunnel,bridge from OSM_PREFIX_roads where type in (\'motorway\', \'motorway_link\', \'trunk\', \'trunk_link\', \'primary\', \'secondary\', \'tertiary\', \'residential\', \'road\', \'living_street\',  \'track\', \'footway\', \'pedestrian\') order by z_order asc, st_length(geometry) asc) as foo using unique osm_id using srid=OSM_SRID"'
    },

	#Display roads
    'display_roads': {
        0:0,
        3:1
    },
    'display_motorways': {
        0:0,
        4:1
    },
    'display_motorway_links': {
        0:0,
        12:1
    },
    'display_trunks': {
        0:0,
        6:1
    },
    'display_trunk_links': {
        0:0,
        12:1
    },
    'display_primaries': {
        0:0,
        8:1
    },
    'display_secondaries': {
        0:0,
        9:1
    },
    'display_tertiaries': {
        0:0,
        10:1
    },
    'display_other_roads': {
        0:0,
        11:1
    },
    'display_pedestrian': {
        0:0,
        12:1
    },
    'display_tracks': {
        0:0,
        12:1
    },
    'display_footways': {
        0:0,
        15:1
    },
    
    #Tunnels
    'display_tunnels': {
        0:0,
        14:1
    },
    
    'tunnel_opacity': 40,

	#Bridges
    'display_bridges': {
        0:0,
        14:1
    },
      
    'motorway_bridge_clr':"186 110 39",
    'motorway_bridge_width':{0:0,14:0.5},
    
    'trunk_bridge_clr':"136 136 136",
    'trunk_bridge_width':{0:0,14:0.4},
    
    'primary_bridge_clr':"136 136 136",
    'primary_bridge_width':{0:0.5,14:1},
    
    'secondary_bridge_clr':"136 136 136",
    'secondary_bridge_width':{0:0.5,14:1},
    
    'tertiary_bridge_clr':"136 136 136",
    'tertiary_bridge_width':{0:0.5,14:1},
    
    'other_bridge_clr':"136 136 136",
    'other_bridge_width':{0:0.5,14:1},
    
    'pedestrian_bridge_clr':"136 136 136",
    'pedestrian_bridge_width':{0:0.5,14:1},
    
    #Oneways
    'display_motorway_oneways': 0,
    'display_trunk_oneways': 0,
    'display_primary_oneways': 0,
    'display_secondary_oneways': {0:0,15:1},
    'display_tertiary_oneways': {0:0,15:1},
    'display_other_oneways': {0:0,15:1},
    
    'oneway_clr': '"#A9C5EB"',
    'oneway_size':8,
     
    #Label priority
    'motorways_label_priority': 9,
    'roads_label_priority': {
        0:1,
        13:9
    },
     
    #Motorways
    'motorway_clr': "255 195 69",
    'motorway_width': {
        0:0.5,
        5:1,
        8:1,
        13:3,
        15:5.5,
        16:12
    },
    
    'display_motorway_outline': 1,
    'motorway_ol_width': {
      	0:0,
     	8:1,
    	10:1,
        13:0.8,
        14:0.5
    },
    'motorway_ol_clr': '186 110 39',
    
    'label_motorways': {
        0:0,
        10:1
    },
    'motorway_font': "sc",
    'motorway_lbl_size': {
        0:0,
        10:7,
        14:9
    },
    'motorway_lbl_clr': '"#333333"',
    'motorway_lbl_ol_clr': '255 195 69',
    
    'motorway_links_clr': "255 235 140",
    'motorway_links_width': {
        0:2,
        13:2.5,
        15:5,
        16:6
    },
   
    #Trunks
    'trunk_clr': {
        0:'"#DAAF85"',
        6:"255 253 139"
    },
    'trunk_width': {
        0:0.5,
        5:1,
        8:1.5,
        11:2.5,
        13:3,
        15:5.5,
        16:12
    },
    
 	'display_trunk_outline': 1,
    'trunk_ol_width': {
        0:0,
        8:0.2,
        9:1,
        10:1,
        14:0.5
    },
    'trunk_ol_clr': '193 181 157',
    
    'label_trunks': {
        0:0
    },
    'trunk_font': "scb",
    'trunk_lbl_size': {
        0:8,
        14:9
    },
    'trunk_lbl_clr': '"#555555"',
    'trunk_lbl_ol_clr': {
        0:'193 181 157',
        9:"255 253 139"
    },
    
    'trunk_links_clr': {
        0:'193 181 157',
        6:"255 235 140"
    },
    'trunk_links_width': {
        0:2,
        13:2.5,
        15:5
    },
	
	#Primaries
    'primary_clr': {
        0:'193 181 157',
        9:'255 253 133'
    },
    'primary_width': {
        0:0.5,
        9:0.75,
        10:1,
        11:2,
        15:8,
        16:12
    },
        
    'display_primary_outline': 1,
    'primary_ol_width': 0.3,
    'primary_ol_clr': '193 181 157',
    
    'label_primaries': {
        0:0,
        12:1
    },
    'primary_font': "sc",
    'primary_lbl_size': {
        0:0,
  		12:7,
        15:8
    },
    'primary_lbl_clr': {
        0:'"#333333"'
    },
    'primary_lbl_ol_clr': {
        0:'193 181 157',
        9:"255 253 139"
    },
    
    #Secondaries
    'secondary_clr': {
        0:'"#aaaaaa"',
        10:'255 253 139'
    },
    'secondary_width': {
        0:0,
        8:0.5,
        10:0.75,
        11:1.5,
        12:2,
        13:3.5,
        15:5.5,
        16:11
    },
    
    'display_secondary_outline': 1,
    'secondary_ol_width': 0.3,
    'secondary_ol_clr': '193 181 157',
    
    'label_secondaries': {
        0:0,
        12:1
    },
    'secondary_font': "sc",
    'secondary_lbl_size': {
        0:0,
        12:7,
        15:8
    },
    'secondary_lbl_clr': '"#333333"',
    'secondary_lbl_ol_clr': '255 253 139',
    
    #Tertiaries
    'tertiary_clr': {
        0:'"#d9cfc6"',
        13:'"#ffffff"'
    },
    'tertiary_width': {
         0:0,
         8:0.5,
         11:0.75,
         14:2.5,
         15:5,
         16:11
    },
    
    'display_tertiary_outline': 1,
    'tertiary_ol_width': 0.3,
    'tertiary_ol_clr': '193 181 157',
    
    'label_tertiaries': {
        0:0,
        15:1
    },
    'tertiary_font': "sc",
    'tertiary_lbl_size': {
        0:0,
        14:6,
        15:7,
        18:8,
    },
    'tertiary_lbl_clr': {
        0:'"#333333"',
        15:'"#000000"'
    },
    'tertiary_lbl_ol_clr': '255 255 255', 

	#Others roads
    'other_clr': {
        0:'"#d9cfc6"',
        13:'"#ffffff"'
        },
    'other_width': {
        0:0,
        8:0.3,
        13:1.2,
        14:1.8,
        15:5,
        16:11
    },
    
    'display_other_outline': {
        0:0,
        13:1
    },
    'other_ol_width': {
        0:0,
        13:0.5,
        14:0.3
    },
    'other_ol_clr': '193 181 157',
    
    'label_other_roads': {
        0:0,
        15:1
    },
    'other_font': "sc",
    'other_lbl_size': {
        0:0,
        14:6,
        15:7,
        16:8
    },
    'other_lbl_clr': {
         0:'"#333333"',
         15:'"#000000"'
    },
    'other_lbl_ol_clr': '255 255 255',
    
    #Pedestrian
    'pedestrian_clr': '255 255 255',
    'pedestrian_width': {
        0:0,
        11:0.5,
        12:0.75,
        13:1,
        14:1.5,
        15:2,
        16:2.5,
        17:3,
        18:3.5,
    },
    
    'display_pedestrian_outline': 1,
    'pedestrian_ol_width': 1,
    'pedestrian_ol_clr': '193 181 157',
    
    'label_pedestrian': {
        0:0,
        15:1
    },
    'pedestrian_font': "sc",
    'pedestrian_lbl_size': {
        0:0,
        15:8,
    },
    'pedestrian_lbl_clr': '"#333333"',
    'pedestrian_lbl_ol_clr': '255 255 255',

	#Track
    'track_clr': {
        0:'"#aaaaaa"',
        15:'"#ffffff"',
    },
    'track_width': {
        0:0,
        11:0.5,
        12:0.75,
        15:1,
    },
    'track_pattern': {
        0: '2 2',
        15: '2 3'
    },
    
    'display_track_outline': 1,
    'track_ol_width': 1,
    'track_ol_clr': '193 181 157',  
    
    'label_track': {
        0:0,
        15:1
    },
    'track_font': "sc",
    'track_lbl_size': {
        0:0,
        15:8,
    },
    'track_lbl_clr': '"#333333"',
    'track_lbl_ol_clr': '255 255 255',

   	#Footway
    'footway_clr': {
        0:'"#aaaaaa"',
        15:'"#ffffff"',
    },
    'footway_width': {
        0:0,
        15:1,
    },
    'footway_pattern': '2 3',
    
    'display_footway_outline': 1,
    'footway_ol_width': 1,
    'footway_ol_clr': '193 181 157',  

    #shields
    'roads_shield_data': {
        0:'"geometry from (select osm_id,geometry,OSM_NAME_COLUMN as name,ref,(regexp_matches(ref, \'([a-z,A-Z]+)? ?([0-9]+)[^;]*\', \'g\'))[1] as shield_class,(regexp_matches(ref, \'([a-z,A-Z]+)? ?([0-9]+)[^;]*\', \'g\'))[2] as shield_no,type,tunnel,bridge from OSM_PREFIX_roads_gen0 = \'motorway\' order by z_order asc, st_length(geometry) asc) as foo using unique osm_id using srid=OSM_SRID"',
        7:'"geometry from (select osm_id,geometry,OSM_NAME_COLUMN as name,ref,(regexp_matches(ref, \'([a-z,A-Z]+)? ?([0-9]+)[^;]*\', \'g\'))[1] as shield_class,(regexp_matches(ref, \'([a-z,A-Z]+)? ?([0-9]+)[^;]*\', \'g\'))[2] as shield_no,type,tunnel,bridge from OSM_PREFIX_roads_gen0 where type in (\'motorway\', \'motorway_link\', \'trunk\', \'trunk_link\', \'primary\') order by z_order asc, st_length(geometry) asc) as foo using unique osm_id using srid=OSM_SRID"',
        9:'"geometry from (select osm_id,geometry,OSM_NAME_COLUMN as name,ref,(regexp_matches(ref, \'([a-z,A-Z]+)? ?([0-9]+)[^;]*\', \'g\'))[1] as shield_class,(regexp_matches(ref, \'([a-z,A-Z]+)? ?([0-9]+)[^;]*\', \'g\'))[2] as shield_no,type,tunnel,bridge from OSM_PREFIX_roads_gen1 where type in (\'motorway\', \'motorway_link\', \'trunk\', \'trunk_link\', \'primary\') order by z_order asc, st_length(geometry) asc) as foo using unique osm_id using srid=OSM_SRID"',
        12:'"geometry from (select osm_id,geometry,OSM_NAME_COLUMN as name,ref,(regexp_matches(ref, \'([a-z,A-Z]+)? ?([0-9]+)[^;]*\', \'g\'))[1] as shield_class,(regexp_matches(ref, \'([a-z,A-Z]+)? ?([0-9]+)[^;]*\', \'g\'))[2] as shield_no,type,tunnel,bridge from OSM_PREFIX_roads where type in (\'motorway\', \'motorway_link\', \'trunk\', \'trunk_link\', \'primary\') order by z_order asc, st_length(geometry) asc) as foo using unique osm_id using srid=OSM_SRID"'
    },
    'display_catchall_shields': {
        0:0,
        9:1
    },

    'display_interstate_shields': {
        0:0,
        7:1
    },

    'display_ushwy_shields': {
        0:0,
        8:1
    },

    'display_secondary_shields': {
        0:0,
        12:1
    },

    'display_other_shields': {
        0:0,
        13:1
    },

    'highway_shield_font': 'scb',

    'interstate_shield_symbol': '"symbols/interstate-shield.png"',
    'interstate_shield_symbol_large': '"symbols/interstate-shield-42px.png"',
    'interstate_shield_size': 18,
    'interstate_shield_lbl_size': 6,
    'interstate_shield_lbl_clr': '255 255 255',
    
    'ushwy_shield_symbol': '"symbols/ushwy-shield-30px.png"',
    'ushwy_shield_symbol_large': '"symbols/ushwy-shield-36px.png"',
    'ushwy_shield_size': 22,
    'ushwy_shield_lbl_size': 6,
    'ushwy_shield_lbl_clr': '0 0 0',
    
    'secondary_shield_symbol': '"ellipse"',
    'secondary_shield_symbol_clr': '246 235 140',
    'secondary_shield_symbol_ol_clr' : '0 0 0',
    'secondary_shield_size': 17,
    'secondary_shield_lbl_size': 6,
    'secondary_shield_lbl_clr': '0 0 0',
    
    'shield_priority':  {
    	0:8,
        13:1
    },
    'other_shield_priority': {
        0:8,
        13:1
    },

    #Railway
    'railways_data': {
        0:'"geometry from (select geometry, osm_id, tunnel from OSM_PREFIX_railways_gen0 where type=\'rail\') as foo using unique osm_id using srid=OSM_SRID"',
        6:'"geometry from (select geometry, osm_id, tunnel from OSM_PREFIX_railways_gen1 where type=\'rail\') as foo using unique osm_id using srid=OSM_SRID"',
        12:'"geometry from (select geometry, osm_id, tunnel from OSM_PREFIX_railways where type=\'rail\') as foo using unique osm_id using srid=OSM_SRID"'
    },
    'display_railways': {
        0:0,
        11:1
    },
    'railway_clr': {
        0:'"#BFBFBF"',
    	14:'"#9D9D9D"'
    },
    'railway_width': {
        0:0.5,
        10:2
    },
    'railway_pattern': '2 2',
    'railway_tunnel_opacity': 40,

    #aeroways
    'display_aeroways': {
        0:0,
        10:1
    },
    'runway_clr': "180 180 180",
    'runway_width': {
        0:1,
        11:2,
        12:3,
        13:5,
        14:7,
        15:11,
        16:15,
        17:19,
        18:23
    },
    
    'runway_center_clr': '80 80 80',
    'runway_center_width': {
        0:0,
        15:1
    },
    'runway_center_pattern' : '2 2',
    
    'taxiway_width': {
        0:0,
        10:0.2,
        13:1,
        14:1.5,
        15:2,
        16:3,
        17:4,
        18:5
    },
    'taxiway_clr': "180 180 180",
    
    #=============================#
    #          buildings          #
    #=============================#
    'display_buildings': {
        0: 0,
        15:1
    },
    'building_clr': '"#bbbbbb"',
    
    'building_ol_clr': '"#333333"',
    'building_ol_width': {
        0:0,
        16:0.1,
        17:0.5
    },
    
    'label_buildings': {
        0: 0,
        15: 1
    }, 
    'building_font': "sc",
    'building_lbl_clr': "0 0 0",
    'building_lbl_size': 8,
    'building_lbl_ol_clr': "255 255 255",
    'building_lbl_ol_width': 2,

    #=============================#
    #            places           #
    #=============================#
    'places_data': {
          0: '"geometry from (select * from OSM_PREFIX_places where type in (\'country\',\'continent\') and OSM_NAME_COLUMN is not NULL order by z_order, population asc nulls first) as foo using unique osm_id using srid=OSM_SRID"',
          3: '"geometry from (select * from OSM_PREFIX_places where type in (\'country\',\'continent\',\'state\') and OSM_NAME_COLUMN is not NULL order by z_order, population asc nulls first) as foo using unique osm_id using srid=OSM_SRID"',
          4: '"geometry from (select * from OSM_PREFIX_places where type in (\'country\',\'state\',\'city\') and OSM_NAME_COLUMN is not NULL order by z_order, population asc nulls first) as foo using unique osm_id using srid=OSM_SRID"',
	  	  7: '"geometry from (select * from OSM_PREFIX_places where type in (\'country\', \'state\',\'city\',\'town\',\'village\') and OSM_NAME_COLUMN is not NULL order by z_order, population asc nulls first) as foo using unique osm_id using srid=OSM_SRID"', 
          8: '"geometry from (select * from OSM_PREFIX_places where OSM_NAME_COLUMN is not NULL order by z_order, population asc nulls first) as foo using unique osm_id using srid=OSM_SRID"'
    },

	#Display places
    'display_continents': {
        0:1,
        3:0
    },

    'display_countries': {
        0:0,
        2:1,
        8:0
    },

    'display_states': {
        0:0,
        4:1,
        9:0
    },

    'display_capitals': 0,

    'display_cities': {
        0:0,
        5:1,
        16:0
    },

    'display_towns': {
        0:1,
        8:1
    },

    'display_villages': {
        0:0,
        10:1
    },

    'display_hamlets': {
        0:0,
        10:1
    },
   
   	#Continent
    'continent_lbl_size': 8,
    'continent_lbl_clr': "100 100 100",
    'continent_lbl_ol_width': "1",
    'continent_lbl_ol_clr': "-1 -1 -1",
    'continent_font': "scb",
    
    #Country
    'country_lbl_size': 8,
    'country_lbl_clr': "100 100 100",
    'country_lbl_ol_width': 2,
    'country_lbl_ol_clr': "-1 -1 -1",
    'country_font': "scb",

    #State
    'state_lbl_size': {
        0:8,
        4:9,
        6:10
    },
    'state_lbl_clr': {
        0:"0 0 0",
        6:'"#5F5F5F"'
    },
    'state_lbl_ol_width': 2,
    'state_lbl_ol_clr': "255 255 255",
    'state_font': "scb",
    'state_maxlength': {
        0:5,
        6:8
    },

    #Capital
    'display_capital_symbol': {
        0:1,
        10:0
    },
    
    'capital_clr': "255 0 0",
    'capital_ol_clr': "0 0 0",
    'capital_size': 6,
    
    'capital_fg_size': 2,
    'capital_fg_clr': "0 0 0",
    
    'capital_font': "sc",
    'capital_lbl_size': {
        0:0,
        3:8,
        8:9,
        10:10,
        13:11,
        15:12
    },
    'capital_lbl_clr': "0 0 0",
    'capital_lbl_ol_clr': "255 255 255",
    'capital_lbl_ol_width':2,
    
    #City
    'display_city_symbol': {
        0:1,
        9:0
    },       
	'city_clr': {
        0:"200 200 200",
        6:"255 255 255"
    },
    'city_size': {
        0:5,
        8:6
    },
    'city_ol_clr': "0 0 0",

    'city_font': "scb",
    'city_lbl_clr': {
        0:"68 68 68",
        6:'46 46 46'
    },
    'city_lbl_size': {
        0:0,
        3:7,
        4:8,
        11:9,
        13:10,
        15:11
    },
    'city_lbl_ol_clr': "255 255 255",
    'city_lbl_ol_width': {
        0:1,
        10:2
    },
    
    #Town
    'display_town_symbol': {
        0:0,
        9:1
    },
	'town_clr': "200 200 200",
    'town_size': {
        0:0,
        8:3,
        10:5
    },
    'town_ol_clr': "0 0 0",
    
    'town_font': "sc",
    'town_lbl_clr': {
        0:'"#666666"',
        8:'0 0 0'
    },
    'town_lbl_ol_clr': "255 255 255",
    'town_lbl_ol_width':1,
    'town_lbl_size': {
        0:0,
        8:8,
        13:10,
        15:11
    },
   
    #Village
    'display_village_symbol': {
        0:1,
        10:0
    },
	'village_clr': "200 200 200",
    'village_size': {
        0:0,
        10:3,
        13:4
    },
    'village_ol_clr': "0 0 0",
    
    'village_lbl_size': {
        0:0,
        10:8,
        13:9,
        15:10
        }, 
    'village_font': "sc",
    'village_lbl_clr': {
        0:'"#444444"',
        13:'0 0 0'
        },
    'village_lbl_ol_clr': "255 255 255",
    'village_lbl_ol_width': 1,
    
    #Hamlet
    'display_hamlet_symbol': 0,
    'hamlet_clr': "200 200 200",
    'hamlet_size': 5,
    'hamlet_ol_clr': "0 0 0",

    'hamlet_lbl_size': {
        0:0,
        10:7,
        15:9,
    },
    'hamlet_font': "sc",
    'hamlet_lbl_clr': {
        0:'"#444444"',
        15:'0 0 0'
    },
    'hamlet_lbl_ol_clr': "255 255 255",
    'hamlet_lbl_ol_width': 1,  
  
    #=============================#
    #           isoline           #
    #=============================#
    'db_isoline_connection': '"host=192.168.6.20 dbname=isoline user=osm password=osm port=5432"',
	
	'isoline_data': '"geometry from (select wkb_geometry as geometry,ogc_fid as osm_id, descriptio as name, zmin from hypso) as foo using unique osm_id using srid=4326"',
    
    'display_isoline': {
		0:0, 
		12:1
	},
    
  	'isoline_clr': '100 100 100',
 	'isoline_width': 0.5
}

    #=============================#
    #        Configuration        #
    #=============================#

styles = {
   'default': {}
}

import sys
from optparse import OptionParser

style_aliases = {
   "default":"default",
}


parser = OptionParser()
parser.add_option("-l", "--level", dest="level", type="int", action="store", default=-1,
                  help="generate file for level n")
parser.add_option("-g", "--global", dest="full", action="store_true", default=False,
                  help="generate global include file")
parser.add_option("-s", "--style",
                  action="store", dest="style", default="default",
                  help="comma separated list of styles to apply (order is important)")

(options, args) = parser.parse_args()

items = vars.items()
for namedstyle in style_aliases[options.style].split(','):
   items = items + styles[namedstyle].items()

style = dict(items)

if options.full:
   print "###### level 0 ######"
   for k,v in style.iteritems():
      if type(v) is dict:
         print "#define _%s0 %s"%(k,v[0])
      else:
         print "#define _%s0 %s"%(k,v)


   for i in range(1,19):
      print
      print "###### level %d ######"%(i)
      for k,v in style.iteritems():
         if type(v) is dict:
            if not v.has_key(i):
               print "#define _%s%d _%s%d"%(k,i,k,i-1)
            else:
               print "#define _%s%d %s"%(k,i,v[i])
         else:
            print "#define _%s%d %s"%(k,i,v)

if options.level != -1:
   level = options.level
   for k,v in style.iteritems():
      print "#undef _%s"%(k)

   for k,v in style.iteritems():
      print "#define _%s _%s%s"%(k,k,level)
