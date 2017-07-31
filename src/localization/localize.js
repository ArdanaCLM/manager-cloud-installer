import LocalizedStrings from 'react-localization';

var supportedLangs = ['en', 'ja'];
var translationData, bundlename, catalog = {};

for (var i = 0; i < supportedLangs.length; i++) {
  bundlename = "./bundles/" + supportedLangs[i] + ".json";
  //require doesn't interpret this as a string correctly unless its converted
  //easiest conversion is to use + ''
  translationData = require(bundlename + '');
  catalog[supportedLangs[i]] = translationData;
}

//TODO - determine what to do with annotated langs... like en-US
var strings = new LocalizedStrings(catalog);
for (i = 0; i < window.navigator.languages.length; i++) {
  if (supportedLangs.indexOf(window.navigator.languages[i]) !== -1) {
    strings.setLanguage(window.navigator.languages[i]);
    break;
  }
}

export function translate(key, ...args) {
  return strings.formatString(strings[key], ...args);
}
