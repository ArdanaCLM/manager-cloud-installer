#!/bin/bash

TARBALL=false

# if -t is specified, build a tarball of the UI bits
while getopts t option
do
  case "${option}"
  in
  t) TARBALL=true;;
  esac
done

#erase the previous dist
rm -rf dist

#first build a bundle version of the javascript
npm run dist

#copy the production index.html to the dist folder
cp index.production dist/index.html

#copy the config file to the dist folder
cp config.json dist

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
  tar -cvf ../day0-install-ui-${SHA}.tar .
  cd ..
fi
