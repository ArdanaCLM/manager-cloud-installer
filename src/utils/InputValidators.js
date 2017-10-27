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
const PCI_ADDRESS = /^[0-9a-fA-F]{4}:[0-9a-fA-F]{2}:[0-9a-fA-F]{2}\.[0-9a-fA-F]$/;
const NET_INTERFACE = /^[0-9a-zA-Z.:_]{1,16}$/;
const CIDR =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:3[0-2]|[1-2]?[0-9])$/;
const STRING_WITH_NO_SPACES = /^\s*\S+\s*$/;

export function IpV4AddressValidator(ipAddress) {
  let retValue = {
    isValid: true,
    errorMsg: ''
  };

  if(IPV4ADDRESS.exec(ipAddress) === null) {
    retValue.isValid = false;
    retValue.errorMsg = translate('input.validator.ipv4address.error');
  }
  return retValue;
}

export function MacAddressValidator(macAddress) {
  let retValue = {
    isValid: true,
    errorMsg: ''
  };

  if(MACADDRESS.exec(macAddress) === null) {
    retValue.isValid = false;
    retValue.errorMsg = translate('input.validator.macaddress.error');
  }

  return retValue;
}

export function PortValidator(port) {
  let retValue = {
    isValid: true,
    errorMsg: ''
  };

  if(PORT.exec(port) === null) {
    retValue.isValid = false;
    retValue.errorMsg = translate('input.validator.port.error');
  }

  return retValue;
}

export function IpV4AddressHostValidator(host) {
  let retValue = {
    isValid: true,
    errorMsg: ''
  };

  if(IPV4ADDRESS_HOST.exec(host) === null) {
    retValue.isValid = false;
    retValue.errorMsg = translate('input.validator.ipv4addresshost.error');
  }

  return retValue;
}

export function PCIAddressValidator(str) {
  if(PCI_ADDRESS.exec(str) === null) {
    return {
      isValid: false,
      errorMsg: translate('input.validator.pciaddress.error')
    };
  } else {
    return {
      isValid: true,
      errorMsg: ''
    };
  }
}

export function NetworkInterfaceValidator(str) {
  if(NET_INTERFACE.exec(str) === null) {
    return {
      isValid: false,
      errorMsg: translate('input.validator.networkinterface.error')
    };
  } else {
    return {
      isValid: true,
      errorMsg: ''
    };
  }
}

export function VLANIDValidator(vlanid) {
  let retValue = {
    isValid: true,
    errorMsg: ''
  };

  if(vlanid && vlanid <= 0 || vlanid > 4094) {
    retValue.isValid = false;
    retValue.errorMsg = translate('input.validator.vlanid.error');
  }

  return retValue;
}

export function CidrValidator(cidr) {
  let retValue = {
    isValid: true,
    errorMsg: ''
  };

  if(CIDR.exec(cidr) === null) {
    retValue.isValid = false;
    retValue.errorMsg = translate('input.validator.cidr.error');
  }
  return retValue;
}

export function UniqueNameValidator(name, props) {
  let retValue = {
    isValid: true,
    errorMsg: ''
  };

  if(props && props.names && props.names.length > 0 &&
    name && props.names.indexOf(name) !== -1) {
    retValue.isValid = false;
    retValue.errorMsg = translate('input.validator.uniquename.error');
  }
  else {
    if(props && props.check_nospace) {
      if(STRING_WITH_NO_SPACES.exec(name) === null) {
        retValue.isValid = false;
        retValue.errorMsg = translate('input.validator.name.spaces.error');
      }
    }
  }
  return retValue;
}

