import { translate } from '../localization/localize.js';

const IPV4ADDRESS =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const MACADDRESS =
  /^[0-9a-fA-F]{1,2}([:-])(?:[0-9a-fA-F]{1,2}\1){4}[0-9a-fA-F]{1,2}$/;
const HOST = /^(?=^.{1,254}$)(^(?:(?!\d+\.)[a-zA-Z0-9_-]{1,63}\.?)+(?:[a-zA-Z]{2,})$)/;
const IPV4ADDRESS_HOST = new RegExp(
  IPV4ADDRESS.toString().slice(1, IPV4ADDRESS.toString().length-1) + '|' +
  HOST.toString().slice(1, HOST.toString().length-1)
);
const PORT = /^0*(?:6553[0-5]|655[0-2][0-9]|65[0-4][0-9]{2}|6[0-4][0-9]{3}|[1-5][0-9]{4}|[1-9][0-9]{1,3}|[0-9])$/;

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

function validatePort(port) {
  let retValue = {
    isValid: true,
    errorMsg: ''
  };

  if(PORT.exec(port) === null) {
    retValue.isValid = false;
    retValue.errorMsg =
      translate('input.validator.port.error');
  }

  return retValue;
}

function validateIpV4AddressHost(host) {
  let retValue = {
    isValid: true,
    errorMsg: ''
  };

  if(IPV4ADDRESS_HOST.exec(host) === null) {
    retValue.isValid = false;
    retValue.errorMsg =
      translate('input.validator.ipv4addresshost.error');
  }

  return retValue;
}

module.exports =  {
  IpV4AddressValidator: validateIpV4Address,
  MacAddressValidator: validateMacAddress,
  PortValidator: validatePort,
  IpV4AddressHostValidator: validateIpV4AddressHost
};
