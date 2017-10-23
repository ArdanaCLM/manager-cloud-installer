var appConfigs = {
  'shimurl': 'http://localhost:8081',
  'deployserviceurl': 'http://localhost:9085',
  //remove this when release
  'dev': true
};


export function getAppConfig(key) {
  return appConfigs[key];
}
