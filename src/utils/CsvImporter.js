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
import Papa from 'papaparse';
import { IpV4AddressValidator, MacAddressValidator } from './InputValidators.js';

/**
 * import CSV from the given file
 *
 * @param {Object} file - File object, like that returned from <input type="file">
 * @param {Object} restrictedValues - object containing lists of values each column
 *                                    whose values are to be restricted
 * @param {Function} callback - function to call when file loading is complete
 */
export function importCSV(file, restrictedValues, callback) {

  restrictedValues = restrictedValues || {};

  // Required fields/columns for Server in CSV file
  const field_defs  = {
    'name': {
      unique: true,
      aliases: [ 'server_name' ],
      required: true
    },
    'id': {
      unique: true,
      aliases: [ 'server_id', 'id' ]
    },
    'ip-addr': {
      unique: true,
      validator: IpV4AddressValidator,
      aliases: [ 'ip', 'ip-address' ],
      required: true
    },
    'mac-addr': {
      unique: true,
      validator: MacAddressValidator,
      aliases: [ 'mac', 'mac-address' ],
      required: true
    },
    'ilo-ip': {
      unique: true,
      validator: IpV4AddressValidator,
      aliases: [ 'ipmi-ip', 'ipmi-ip-address', 'ilo-ip-address' ]
    },
    'ilo-user': {
      aliases: [ 'ipmi-user', 'ipmi-username', 'ipmi-user-name', 'ilo-username', 'user' ]
    },
    'ilo-password': {
      aliases: [ 'ilo-pass', 'ipmi-password', 'ipmi-pass', 'password', 'pass' ]
    },
    'role': {
      restriction: restrictedValues['server-role'],
      aliases: [ 'server-role' ]
    },
    'server-group': {
      restriction: restrictedValues['server-groups'],
      aliases: [ 'server-groups', 'group' ]
    },
    'nic-mapping': {
      restriction: restrictedValues['nic-mappings'],
      aliases: [ 'server-nic-map', 'nic-map' ]
    }
  };

  // Create a map that maps both aliases to their
  // desired key names
  function getFieldMapping() {

    let mapping = new Map();
    for (let key in field_defs) {
      for (let alias of field_defs[key].aliases) {
        mapping.set(alias, key);
      }
    }
    return mapping;
  }

  function normalizeName(field) {
    // 1. remove whitespace at head and tail
    // 2. replace space and _ with -
    // 3. lowercase
    return field.toLowerCase().trim().replace(/[ _]/g, '-');
  }


  let results = {
    data: [],
    errors: []
  };

  const mapping = getFieldMapping();
  const required_keys = Object.keys(field_defs).filter(k => field_defs[k].required);

  let seen = {};   // track which values we've already seen, to detect dups
  // Create an entry for each unique column
  for (let d in field_defs) {
    if (field_defs[d].unique)
      seen[d] = {};
  }
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    step: row => {
      let result = {};
      let validRow = true;

      // convert to well-known keys
      for(let key in row.data[0]) {
        let field = normalizeName(key);

        if (mapping.has(field)) {
          field = mapping.get(field);
        }

        const val = row.data[0][key];
        result[field] = val;

        if (field_defs[field]) {

          // If the field has a validator func, verify that it passes
          if (field_defs[field].validator) {
            const retValue = field_defs[field].validator(val);
            if (!retValue.isValid) {
              results.errors.push(val + ' is invalid: ' + retValue.errorMsg);
              validRow = false;
            }
          }

          // If the field must be unique, verify that we are not seeing a repeat
          if (field_defs[field].unique) {
            if (seen[field][val]) {
              results.errors.push(val + ' is a duplicate');
              validRow = false;
            }
            seen[field][val] = true;
          }

          // If the field has a restricted set of values, verify against it
          if (field_defs[field].restriction && ! (field_defs[field].restriction.includes(val))) {
            results.errors.push(val + ' is invalid');
            validRow = false;
          }
        }
      }

      if (validRow) {
        // Verify that all required fields are present
        const missing = required_keys.filter(k => ! (k in result));
        if (missing.length > 0) {
          results.errors.push('row missing required field(s): ', missing.join(','));
          validRow = false;
        }
      }

      if (validRow) {
        results.data.push(result);
      }
    },
    complete: () => {
      // Invoke the user-supplied callback to return the results
      if (callback) {
        callback(results);
      }
    }
  });
}
