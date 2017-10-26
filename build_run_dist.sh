#!/bin/bash

# build the neccessary UI files
./build_ui_dist.sh

# delete any existing content from the server/web folder
rm -rf ./server/web

# recreate the server/web folder
mkdir -p ./server/web

# copy UI files from ./dist to ./server/web
cp -R ./dist/* ./server/web

# create the venv (if it doesnt exists)
virtualenv --python=python2.7 manager_cloud_installer_server_venv

# activate the venv
source manager_cloud_installer_server_venv/bin/activate

# cd into the server folder
cd server

# pip install the requirements
pip install -r requirements.txt

# start the flask server via main.py
python main.py
