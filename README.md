# SUSE OpenStack Cloud Deployer
The cloud installer that will reside with SUSE Manager

## How to run
Move to the root of the project and run `npm install` which will install most dependencies

Install `json-server` globally with `sudo npm install json-server -g`

Install tox via pip:  `pip install tox`

After that, run `npm start` which will bundle the react app and start the express server

You will get the express server (UI) running on `localhost:3000` and the json-server (API Mock) on `localhost:8080`

To run the selenium tests:
1. perform initial setup `npm run protractor-setup` (once, does not need to be done each time)
2. start the app in another terminal `npm start`
3. run the tests `npm run protractor`
For more information on protractor/selenium locators see http://www.protractortest.org/#/locators
