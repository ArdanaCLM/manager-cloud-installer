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

die() {
   echo "$@" >&2
   exit 1
}

# install npm dependencies to run the build
npm install

TARBALL=false

# if -t is specified, build a tarball of the UI bits
while getopts t option
do
  case "${option}" in
  t) TARBALL=true;;
  esac
done

#erase the previous dist
rm -rf dist

#compile the css/less files
npm run less || die "npm less compilation failed"

#build a bundle version of the javascript
npm run dist || die "npm dist failed"

#copy the production index.html to the dist folder
cp index.production dist/index.html

#copy the config file to the dist folder
cp config.production dist/config.json

#copy non-bundled third-party dependencies into dist
# bootstrap
mkdir -p dist/lib/bootstrap
cp third_party/bootstrap/* dist/lib/bootstrap
# jquery
mkdir -p dist/lib/jquery
cp third_party/jquery/* dist/lib/jquery 

#copy resources (images, fonts) into dist
mkdir dist/images
cp src/images/* dist/images
mv dist/images/favicon.ico dist/favicon.ico

mkdir -p dist/node_modules/material-design-icons/iconfont
cp node_modules/material-design-icons/iconfont/* dist/node_modules/material-design-icons/iconfont

mkdir -p dist/lib/fonts
cp third_party/fonts/* dist/lib/fonts

#create a version variable using the commit hash
SHA=$(git rev-parse HEAD | cut -c1-6)

if $TARBALL
then
  #create a tarball of the UI dist
  cd dist
  tar -czvf ../cloudinstaller-webonly-${SHA}.tgz .
fi
