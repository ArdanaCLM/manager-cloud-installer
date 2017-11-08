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
  'shimurl': window.location.protocol + '//' + window.location.hostname + ':8081',
  'deployserviceurl': window.location.protocol + '//' + window.location.hostname + ':9085',
  //remove this when release
  'dev': true
};

// check for a config file, if present, overwrite the defaults
fetch('config.json')
  .then(response => response.json())
  .then((responseData) =>
  {
    Object.assign(appConfigs, responseData);
  });

export function getAppConfig(key) {
  return appConfigs[key];
}
