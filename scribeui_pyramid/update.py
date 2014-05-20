# If you installed scribeui in the past and are updating to a moe recent 
# version of the app, this script will migrate your workspaces and maps to the
# current version of scribeui.

# 
import os, sys
import sqlite3 as lite #Database 
import pprint #For debugging purposes

try:
    con = lite.connect('db/database.db')
    con.row_factory = lite.Row
    cur = con.cursor()    
    cur.execute('select * from maps, workspaces where workspaces.ws_id=maps.ws_id order by map_id')
    
    maps = cur.fetchall()
    for m in maps:
        if m['map_type'] == 'Scribe':
            pathMap = 'workspaces/'+m['ws_name']+'/'+m['map_name'];
            cur.execute('select * from groups where map_id=? order by group_index',(m['map_id'],))
            groups = cur.fetchall()
            
            if not os.path.isfile(pathMap+'/config'): #if config is already there, we pass
                with open(pathMap+'/config', 'w+') as f:
                    # write new config files
                    f.write("ORDER {\n")
                    for i in range(len(groups)):
                        os.rename(pathMap+'/editor/groups/'+groups[i]['group_name'], pathMap+'/editor/groups/'+groups[i]['group_name']+'.layer')
                        f.write(" "+str(i+1)+": groups/"+groups[i]['group_name']+".layer \n")
                    f.write("}")
                    #delete groups from database
                    cur.execute("delete from groups where map_id=?",(m['map_id'],))
                    con.commit()
    if con:
        con.close()

except lite.Error, e:
    
    print "Error %s:" % e.args[0]
    sys.exit(1)
