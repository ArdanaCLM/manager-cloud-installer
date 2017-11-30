// (c) Copyright 2017 SUSE LLC
/**
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*    http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
**/
var appConfigs = {
  'shimurl': window.location.protocol + '//' + window.location.hostname + ':' + 8081,
};

// check for a config file, if present, overwrite the defaults
function loadConfig() {
  return fetch('config.json')
    .then(response => response.json())
    .then((responseData) =>
    {
      return Object.assign(appConfigs, responseData);
    });
}

// IMPORTANT:
//   This function accesses appConfigs, which is populated
// asynchronously.  This function will introduce a race condition
// if called before that function has completed.
export function getAppConfig(key) {
  return appConfigs[key];
}


var cfgPromise;

// Return a promise whose value is the key being requested.  When
// called the first time, there will be a slight delay in order to
// actually load the config file, which in turn is done by loadConfig
// in a promise.  Subsequent calls to this function will not trigger
// re-loading the file since we are storing and reusing the result
// of the loadConfig promise.
//
export function getConfig(key) {
  cfgPromise = cfgPromise || loadConfig();
  return cfgPromise.then(cfg => cfg[key]);
}

