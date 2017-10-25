var appConfigs = {
  'shimurl': 'http://localhost:8081',
  'deployserviceurl': 'http://localhost:9085'
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
