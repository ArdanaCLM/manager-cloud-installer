import LocalizedStrings from 'react-localization';

var supportedLangs = ['en', 'ja'];
var translationData, bundlename, catalog = {};

for (var i = 0; i < supportedLangs.length; i++) {
  bundlename = './bundles/' + supportedLangs[i] + '.json';
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
  // Note!
  // For some bizarre reason, strings.formatString returns an array of strings rather than a single string.
  // The join() corrects this by joining the elements into a signle string.
  try {
    return strings.formatString(strings[key], ...args).join('');
  } catch (e) {
    console.error('Unable to translate '+key); // eslint-disable-line no-console
    return key;
  }
}
