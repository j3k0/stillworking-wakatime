#!/usr/bin/env python
import os
import time
import sys
from datetime import datetime
from datetime import timedelta

db_file = os.path.expanduser('~/.stillworking.db')

last_entry = None
activities = {}

def _db_process():
    global db_file
    with open(db_file, 'rb') as f:
        for line in f:
            _db_process_line(line)

def _db_parse_line(line):
    tokens = line.split('\n')[0].split(';')
    date = tokens[0]
    project = tokens[1]
    entity = ';'.join(tokens[2:])
    return [date, project, entity]

def _db_process_line(line):
    global last_entry
    global activities
    entry = _db_parse_line(line)
    [next_date, next_project, next_entity] = entry
    if last_entry:
        [last_date, last_project, last_entity] = last_entry
    else:
        last_date = 0
        last_project = ''
        last_entity = ''
    last_entry = entry
    if last_project:
        duration = int(next_date) - int(last_date)
        if duration > 60 * 15:
            # no reports for a long period, assuming we stopped working
            duration = 0
        month = datetime.utcfromtimestamp(int(last_date)).strftime('%Y-%m')
        if month:
            key = "%s;%s" % (month, last_project)
            activities[key] = activities.get(key, 0) + float(duration)

_db_process()

def should_show(date, project):
    if len(sys.argv) < 2:
        return True
    for i in sys.argv[1:]:
        if not date.startswith(i) and project != i:
            return False
    return True

total_duration = 0
for key in sorted(activities.keys()):
    duration = activities[key]
    [date, project] = key.split(';')
    if should_show(date, project):
        duration_fmt = str(timedelta(seconds=duration))[:-3]
        print "%7s    [%5s] %15s" % (date, duration_fmt, project)
        total_duration += duration

duration_fmt = str(timedelta(seconds=total_duration))[:-3]
print "      TOTAL:%5s " % duration_fmt

