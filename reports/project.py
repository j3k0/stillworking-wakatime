#!/usr/bin/env python
import math
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
            # no reports for a long period, assuming we stopped working after 2 minutes
            duration = 60 * 2
        else:
            seconds = duration % 60
            duration -= seconds
            if seconds > 30:
                duration += 60
        date = datetime.utcfromtimestamp(int(last_date)).strftime('%Y-%m-%d')
        if date:
            key = "%s;%s;%s" % (date, last_project, last_entity)
            activities[key] = activities.get(key, 0) + duration
_db_process()

def should_show(date, project, entity):
    if len(sys.argv) < 2:
        return True
    for i in sys.argv[1:]:
        if not date.startswith(i) and project != i and entity != i:
            return False
    return True

def format_duration(d):
    hours = math.floor(d / 3600)
    rest = d - hours * 3600
    minutes = round(rest / 60)
    return "%d:%02d" % (hours, minutes)

total_duration = 0
for key in sorted(activities.keys()):
    duration = activities[key]
    [date, project, entity] = key.split(';')
    if should_show(date, project, entity):
        total_duration += duration
        duration_fmt = format_duration(duration)
        print "%10s [%5s] %15s: %s" % (date, duration_fmt, project, entity)

duration_fmt = format_duration(total_duration)
print "    TOTAL: %6s " % duration_fmt
