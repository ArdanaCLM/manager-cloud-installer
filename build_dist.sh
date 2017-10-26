#!/bin/bash

# build the neccessary UI files
./build_ui.sh

# check for tarball flag
TARBALL=false

# if -t is specified, build a tarball of the venv 
while getopts t option
do
  case "${option}" in
  t) TARBALL=true;;
  esac
done


# create the venv (if it doesnt exists)
virtualenv --python=python2.7 manager_cloud_installer_server_venv

# delete any existing content from the server/web folder
## rm -rf ./server/web
rm -rf ./manager_cloud_installer_server_venv/lib/python/site-packages/cloudinstaller

# recreate the server/web folder
## mkdir -p ./server/web
mkdir -p ./manager_cloud_installer_server_venv/lib/python2.7/site-packages/cloudinstaller/web

# copy UI files from ./dist to ./server/web
## cp -R ./dist/* ./server/web
cp -R ./server/* ./manager_cloud_installer_server_venv/lib/python2.7/site-packages/cloudinstaller
cp -R ./dist/* ./manager_cloud_installer_server_venv/lib/python2.7/site-packages/cloudinstaller/web

# activate the venv
source manager_cloud_installer_server_venv/bin/activate

# pip install the requirements
pip install -r server/requirements.txt

# if the tarball flag is true, build the tarball
if $TARBALL
then
  # create a version variable using the commit hash
  SHA=$(git rev-parse HEAD | cut -c1-6)
  echo ${SHA} > manager_cloud_installer_server_venv/buildinfo.txt

  # if an existing tarball exists, delete it
  rm cloudinstaller-${SHA}.tar

  # create a tarball of the venv
  cd manager_cloud_installer_server_venv
  tar -cvf ../cloudinstaller-${SHA}.tar .
fi
