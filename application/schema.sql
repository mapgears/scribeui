drop table if exists workspaces;
create table workspaces (
  ws_id integer primary key autoincrement,
  ws_name string not null,
  password string not null
);

drop table if exists maps;
create table maps (
  map_id integer primary key autoincrement,
  map_name string not null,
  map_type string not null, 
  map_desc string,
  git_url string,
  git_user string,
  git_password string,
  ws_id integer not null
);

drop table if exists groups;
create table groups (
  group_id integer primary key autoincrement,
  group_name string not null,
  group_index integer not null,
  map_id integer not null
);

drop table if exists pois;
create table pois (
  poi_id integer primary key autoincrement,
  poi_name string not null,
  latitude real not null,
  longitude real not null,
  scalelvl integer,
  ws_id integer not null
);


-- INSERT INTO maps(map_id, map_name, map_type, map_desc, ws_id) VALUES("0","*OSM-GoogleLike", "Scribe","Template OSM-GoogleLike","0");
INSERT INTO maps(map_id, map_name, map_type, map_desc, ws_id) VALUES("1","*NaturalEarth", "Scribe", "Template Natural Earth","0");
INSERT INTO maps(map_id, map_name, map_type, map_desc, ws_id) VALUES("2","*OSM-Basemaps", "Basemaps", "Template Basemaps","0");
INSERT INTO maps(map_id, map_name, map_type, map_desc, ws_id) VALUES("3","*Standard", "Standard", "Template Standard","0");


INSERT INTO groups(group_name, group_index, map_id) VALUES("places", "6", "0");
INSERT INTO groups(group_name, group_index, map_id) VALUES("borders", "5", "0");
INSERT INTO groups(group_name, group_index, map_id) VALUES("buildings", "4", "0");
INSERT INTO groups(group_name, group_index, map_id) VALUES("roads", "3", "0");
INSERT INTO groups(group_name, group_index, map_id) VALUES("water", "2", "0");
INSERT INTO groups(group_name, group_index, map_id) VALUES("landusage", "1", "0");
INSERT INTO groups(group_name, group_index, map_id) VALUES("land", "0", "0");

INSERT INTO groups(group_name, group_index, map_id) VALUES("cities", "6", "1");
INSERT INTO groups(group_name, group_index, map_id) VALUES("roads", "5", "1");
INSERT INTO groups(group_name, group_index, map_id) VALUES("admin", "4", "1");
INSERT INTO groups(group_name, group_index, map_id) VALUES("water", "3", "1");
INSERT INTO groups(group_name, group_index, map_id) VALUES("urban", "2", "1");
INSERT INTO groups(group_name, group_index, map_id) VALUES("land", "1", "1");
INSERT INTO groups(group_name, group_index, map_id) VALUES("ocean", "0", "1");

INSERT INTO groups(group_name, group_index, map_id) VALUES("places.map", "6", "2");
INSERT INTO groups(group_name, group_index, map_id) VALUES("borders.map", "5", "2");
INSERT INTO groups(group_name, group_index, map_id) VALUES("buildings.map", "4", "2");
INSERT INTO groups(group_name, group_index, map_id) VALUES("roads.map", "3", "2");
INSERT INTO groups(group_name, group_index, map_id) VALUES("water.map", "2", "2");
INSERT INTO groups(group_name, group_index, map_id) VALUES("landusage.map", "1", "2");
INSERT INTO groups(group_name, group_index, map_id) VALUES("land.map", "0", "2");

INSERT INTO groups(group_name, group_index, map_id) VALUES("admin.map", "2", "3");
INSERT INTO groups(group_name, group_index, map_id) VALUES("ocean.map", "1", "3");
INSERT INTO groups(group_name, group_index, map_id) VALUES("land.map", "0", "3");

INSERT INTO pois(poi_name, latitude, longitude, scalelvl, ws_id) VALUES("Quebec - Quebec","46.83","-71.11","524288","0");
