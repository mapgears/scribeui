# Update script to import workspaces from scribeui 0.5 to scribeui 1.0
 
import os, sys
import sqlite3 as lite 
import pprint 
import shutil
import stat
def copytree(src, dst, symlinks = False, ignore = None):
  if not os.path.exists(dst):
    os.makedirs(dst)
    shutil.copystat(src, dst)
  lst = os.listdir(src)
  if ignore:
    excl = ignore(src, lst)
    lst = [x for x in lst if x not in excl]
  for item in lst:
    s = os.path.join(src, item)
    d = os.path.join(dst, item)
    if symlinks and os.path.islink(s):
      if os.path.lexists(d):
        os.remove(d)
      os.symlink(os.readlink(s), d)
      try:
        st = os.lstat(s)
        mode = stat.S_IMODE(st.st_mode)
        os.lchmod(d, mode)
      except:
        pass # lchmod not available
    elif os.path.isdir(s):
      copytree(s, d, symlinks, ignore)
    else:
      shutil.copy2(s, d)

try:
    con = lite.connect('application/db/database.db')
    con.row_factory = lite.Row
    cur = con.cursor()    
    cur.execute('select * from maps, workspaces where workspaces.ws_id=maps.ws_id order by map_id')
    
    con2 = lite.connect('scribeui.sqlite')
    con2.row_factory = lite.Row
    cur2 = con2.cursor()    

    maps = cur.fetchall()
    for m in maps:
        pathOldMap = 'application/workspaces/'+m['ws_name']+'/'+m['map_name']
        pathMap = 'workspaces/'+m['ws_name']+'/'+m['map_name']
        print("Copying "+pathOldMap+" to "+ pathMap)
        if not os.path.exists(pathMap):
          copytree(pathOldMap, pathMap)
        else:
          raise "The directory "+pathMap+" already exists"
        cur.execute('select * from groups where map_id=? order by group_index',(m['map_id'],))
        groups = cur.fetchall()
        
        if not os.path.isfile(pathMap+'/config'): #if config is already there, we pass
            with open(pathMap+'/config', 'w+') as f:
                print("Writing new group file")
                # write new config files
                f.write("ORDER {\n")
                for i in range(len(groups)):
                    if m['map_type'] == "Scribe":
                        os.rename(pathMap+'/editor/groups/'+groups[i]['group_name'], pathMap+'/editor/groups/'+groups[i]['group_name']+'.layer')
                        f.write(" "+str(i+1)+": groups/"+groups[i]['group_name']+".layer \n")
                    elif m['map_type'] == "Standard":
                        f.write(" "+str(i+1)+": "+groups[i]['group_name']+" \n")
                f.write("}")
                #delete groups from database
                cur2.execute("select * from workspaces where name=?",(m['ws_name'],))
                ws = cur2.fetchone()
                if not ws:
                    print("Adding workspace to the database...")
                    cur2.execute("insert into workspaces(name) values(?)",(m['ws_name'],))
                    ws_id = cur2.lastrowid
                else:
                    ws_id = ws['id']
                    
                print("Adding map to the database...")
                cur2.execute("insert into maps(name, workspace_id, type) values(?, ?, ?)",(m['map_name'], ws_id, m['map_type'],))
                con2.commit()
                
    if con:
        con.close()
    if con2:
        con2.close()
    print("Done!")

except lite.Error, e:
    
    print "Error %s:" % e.args[0]
    sys.exit(1)

