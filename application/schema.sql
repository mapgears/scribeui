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
  map_desc string,
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


INSERT INTO maps(map_id, map_name, map_desc, ws_id) VALUES("0","*default","Template par defaut","0");

INSERT INTO groups(group_name, group_index, map_id) VALUES("landuse", "1", "0");
INSERT INTO groups(group_name, group_index, map_id) VALUES("land", "0", "0");

INSERT INTO pois(poi_name, latitude, longitude, scalelvl, ws_id) VALUES("Quebec - Quebec","46","-71","10","0");