#!/bin/bash
# (c) Copyright 2017 SUSE LLC

# package the server and UI components into the right folder
./build_dist.sh

# activate the venv
source manager_cloud_installer_server_venv/bin/activate

# start the flask server via main.py
./manager_cloud_installer_server_venv/bin/python ./manager_cloud_installer_server_venv/lib/python2.7/site-packages/cloudinstaller/main.py
