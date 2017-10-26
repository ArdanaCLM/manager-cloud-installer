#!/bin/bash

# package the server and UI components into the right folder
./build_dist.sh

# activate the venv
source manager_cloud_installer_server_venv/bin/activate

# cd into the server folder
# cd server

# start the flask server via main.py
python ./manager_cloud_installer_server_venv/lib/python2.7/site-packages/cloudinstaller/main.py