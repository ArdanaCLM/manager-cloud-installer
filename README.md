(c) Copyright 2017 SUSE LLC

# SUSE OpenStack Cloud Deployer
The cloud installer that will reside with SUSE Manager

## How to run
Move to the root of the project and run `npm install` which will install most dependencies

Install `json-server` globally with `sudo npm install json-server -g`

Install tox via pip:  `pip install tox`

If you're not running minified (see below), you will need to update your config.json to point to the
default url for the shim layer, do this by adding the following line to config.json:
"shimurl" : "http://localhost:8081"

After that, run `npm start` which will bundle the react app and start the express server

You will get the express server (UI) running on `localhost:3000` and the json-server (API Mock) on `localhost:8080`

To run the selenium tests:
1. perform initial setup `npm run protractor-setup` (once, does not need to be done each time)
2. start the app in another terminal `npm start`
3. run the tests `npm run protractor`
For more information on protractor/selenium locators see http://www.protractortest.org/#/locators

# Building and running the production version of the installer
Build just the ui components (output to "dist" folder):  
`build_ui.sh`

Build just the ui components and package them into a tarball:  
`build_ui.sh -t`

Build the entire app (output to manager_cloud_installer_server_venv):  
`build_dist.sh`

Build the entire app and create tarball out of the output:  
`build_dist.sh -t`

`build_dist.sh -t` will create a cloudinstaller-{SHA}.tar file that can be untarred in another location.  
To run the application from that location, run the venv copy of "python" on lib/python2.7/site-packages/cloudinstaller/main.py

For example:  
`cd /tmp`  
`mkdir cloudinstaller`  
`cd cloudinstaller`  
`cp <repo_location>/cloudinstaller-934A34.tgz .`  
`tar -xvf cloudinstaller-934A34.tgz`  
`bin/python lib/python2.7/site-packages/cloudinstaller/main.py`  

Note!  
You will need an appropriate ardana-service backend to provide data model information. A link to that repo will be put here if/when it becomes public  
