#!/bin/bash
# (c) Copyright 2017 SUSE LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# build the neccessary UI files
./build_ui.sh

# whether to create a tarball of the dist, set to true with -t
TARBALL=false

# whether to delete the previous tarballs for the same git revision, set to true with -d
DELETEPREV=false

# indicates whether to produce a sha256 file of the tarball, no-op if tarball isnt built, set to true with -s
CREATESHA=false

# if -t is specified, build a tarball of the venv 
while getopts tds option
do
  case "${option}" in
  t) TARBALL=true;;
  d) DELETEPREV=true;;
  s) CREATESHA=true;;
  esac
done


# create the venv (if it doesnt exists)
virtualenv --python=python2.7 manager_cloud_installer_server_venv

# delete any existing content from the server/web folder
rm -rf ./server/web
rm -rf ./manager_cloud_installer_server_venv/lib/python/site-packages/cloudinstaller

# recreate the server/web folder
mkdir -p ./manager_cloud_installer_server_venv/lib/python2.7/site-packages/cloudinstaller/web

# copy UI files from ./dist to ./server/web
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

  DATE=`date -u +"%Y%m%dT%H%M%SZ"`

  if $DELETEPREV
  then
    # if an existing tarball exists for the same commit, delete it
    # and any sha256/md5 sums associated with those files
    rm cloudinstaller-*-${SHA}.tgz
    rm cloudinstaller-*-${SHA}.tgz.sha256
    rm cloudinstaller-*-${SHA}.tgz.md5
  fi

  FILENAME=cloudinstaller-${DATE}-${SHA}.tgz
  # create a tarball of the venv
  cd manager_cloud_installer_server_venv
  tar -czvf ../${FILENAME} .
  cd ..

  if $CREATESHA
  then
    # create sha256 and md5 checksums of the tgz file
    sha256sum ${FILENAME} > ${FILENAME}.sha256
    md5sum ${FILENAME} > ${FILENAME}.md5
  fi
fi
