import { translate } from '../localization/localize.js';

const IPV4ADDRESS =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const MACADDRESS =
  /^[0-9a-fA-F]{1,2}([:-])(?:[0-9a-fA-F]{1,2}\1){4}[0-9a-fA-F]{1,2}$/;

function validateIpV4Address(ipAddress) {
  let retValue = {
    isValid: true,
    errorMsg: ''
  };

  if(IPV4ADDRESS.exec(ipAddress) === null) {
    retValue.isValid = false;
    retValue.errorMsg =
      translate('input.validator.ipv4address.error');
  }

  return retValue;
}

function validateMacAddress(macAddress) {
  let retValue = {
    isValid: true,
    errorMsg: ''
  };

  if(MACADDRESS.exec(macAddress) === null) {
    retValue.isValid = false;
    retValue.errorMsg =
      translate('input.validator.macaddress.error');
  }

  return retValue;
}

module.exports =  {
  IpV4AddressValidator: validateIpV4Address,
  MacAddressValidator: validateMacAddress
};
