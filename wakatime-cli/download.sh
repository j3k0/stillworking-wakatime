#!/bin/bash
set -e
curl --location https://github.com/wakatime/wakatime/archive/master.zip -o master.zip
rm -fr wakatime-master
unzip -o master.zip
rm -f master.zip
