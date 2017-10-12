#!/bin/bash

#erase the previous dist
rm -rf dist

#first build a bundle version of the javascript
npm run dist

#copy the production index.html to the dist folder
cp index.production dist/index.html

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
