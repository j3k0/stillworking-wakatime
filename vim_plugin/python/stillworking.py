import os
import time

plugin_id = "stillworking/1.1.0"
db_file = os.path.expanduser('~/.stillworking.db')

def _read_last_line(filename):
    with open(filename, 'rb') as f:
        f.seek(-2, os.SEEK_END)
        while f.read(1) != b'\n':
            f.seek(-2, os.SEEK_CUR)
        return f.readline().decode()

def _read_last_db_entry():
    global db_file
    line = _read_last_line(db_file)
    tokens = line.split('\n')[0].split(';')
    date = tokens[0]
    project = tokens[1]
    entity = ';'.join(tokens[2:])
    return [date, project, entity]

last_heartbeat = 0

def _send_heartbeat(project, entity):
    global plugin_id
    os.system("wakatime --plugin '%s' --entity-type app --project '%s' --entity '%s' &" % (
        plugin_id,
        project.replace("'", ""),
        entity.replace("'", "")
    ))

def _store_heartbeat(date, project, entity):
    global db_file
    with open(db_file, 'a') as file:
        file.write("%s;%s;%s\n" % (date, project, entity))

def on_keypress():
    global last_heartbeat
    now = time.time()
    if now - last_heartbeat > 100:
        last_heartbeat = now
        [date, project, entity] = _read_last_db_entry()
        if project == '' or now - float(date) > 15 * 60:
            os.system("stillworking-wakatime --once")
            return
        if project != '' and now - float(date) > 100:
            _send_heartbeat(project, entity)
            _store_heartbeat(int(now), project, entity)
            return

# on_keypress()
# read the last line from ~/.stillworking.db
# if older than 14 minutes, open the popup
# if older than 2 minutes, send wakatime heartbeat
