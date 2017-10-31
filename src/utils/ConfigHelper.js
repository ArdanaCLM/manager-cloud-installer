// (c) Copyright 2017 SUSE LLC
var appConfigs = {
  'shimurl': 'http://localhost:8081',
  'deployserviceurl': 'http://localhost:9085',
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
