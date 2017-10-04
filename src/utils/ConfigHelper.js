var appConfigs = {
  'shimurl': 'http://localhost:8081',
  'deployserviceurl': 'http://localhost:9085'
};


export function getAppConfig(key) {
  return appConfigs[key];
}
