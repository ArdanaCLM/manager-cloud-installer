# SUSE OpenStack Cloud Deployer
The cloud installer that will reside with SUSE Manager

## How to run
Move to the root of the project and run `npm install` which will install all dependencies

Install `json-server` globally with `sudo npm install json-server -g`

After that, run `npm start` which will bundle the react app and start the express server

You will get the express server (UI) running on `localhost:3000` and the json-server (API Mock) on `localhost:8080`