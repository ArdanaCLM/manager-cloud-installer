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
import { Map } from 'immutable';
import { alphabetically, byServerNameOrId } from './Sort.js';

export function isRoleAssignmentValid (role, checkInputs) {
  let minCount =  role.minCount;
  let memberCount = role.memberCount;
  let svrSize = role.servers.length;
  if (memberCount && svrSize !== memberCount) {
    return false;
  }
  if(minCount && svrSize < minCount) {
    return false;
  }
  if(checkInputs) {
    return role.servers.every((server) =>
      checkInputs.every(key => (server[key] ? true : false))
    );
  }
  return true;
}

export function getServerGroups(model) {
  let groups = model.getIn(['inputModel','server-groups'])
    .sort((a,b) => alphabetically(a.get('name'), b.get('name')))
    .map(group => group.get('name')).toJS();
  return groups;
}

export function getNicMappings(model) {
  return model.getIn(['inputModel','nic-mappings'])
    .sort((a,b) => alphabetically(a.get('name'), b.get('name')))
    .map(nic => nic.get('name')).toJS();
}

function getCleanedServer(srv) {
  const strId = srv['id'].toString();
  return {
    'id': strId,
    'name': srv.name || strId,
    'ip-addr': srv['ip-addr'],
    'mac-addr': srv['mac-addr'] || '',
    'role': srv['role'] || '',
    'server-group': srv['server-group'] || '',
    'ilo-ip': srv['ilo-ip'] || '',
    'ilo-user': srv['ilo-user'] || '',
    'ilo-password': srv['ilo-password'] || '',
    'nic-mapping': srv['nic-mapping'] || ''
  };
}

// Retrieve summarized server role information from the model
// Each element in this list is an object containing:
// - name        : the displayed name, such as "compute"
// - serverRole  : the role name, such as "COMPUTE-ROLE"
// - servers[]   : list of servers that have the role
// - minCount    : minimum count of servers in the role
//     or
// - memberCount : exact count of servers in the role
// - group       : 'clusters' or 'resources' (the type of role)
export function getServerRoles (model) {
  const servers = model.getIn(['inputModel', 'servers']).toJS();

  // TODO: Handle multiple control planes
  const cpData = model.getIn(['inputModel', 'control-planes', '0']).toJS();

  let results = [];
  for (let group of ['clusters','resources']) {
    results = results.concat(cpData[group].map((res) => {
      let role = {
        'name': res['name'],
        'serverRole': res['server-role'],
        'group': group,
        'servers': servers
          .filter(s => s.role === res['server-role'])
          .map(s => getCleanedServer(s))          // filter out any extra fields
          .sort((a,b) => byServerNameOrId(a,b))   // sort servers by name or id within each role
      };
      if (group === 'clusters')
        role['memberCount'] = res['member-count'] || 0;
      else
        role['minCount'] = res['min-count'] || 0;
      return role;
    }));
  }
  // Sort the role list by role name
  return results.sort((a,b) => alphabetically(a['name'],b['name']));
}

// Merges the relevant properties of destination server into the src and returns the merged version.  Neither
// src or dest are modified
export function  getMergedServer (src, dest, props)  {
  let result = Object.assign({}, src instanceof Map ? src.toJS() : src);
  props.forEach(p => {
    if (p in dest)
      result[p] = dest[p];
  });

  return result;
}

export function updateServersInModel(server, model, props) {
  let retModel = model.updateIn(['inputModel','servers'], list => list.map(svr => {
    if (svr.get('id') === server.id) {
      let update_server = getMergedServer(svr, server, props);
      //clean up empty value entries
      for (let key in update_server) {
        if (update_server[key] === undefined || update_server[key] === '') {
          delete update_server[key];
        }
      }
      // make it a Map
      return Map(update_server);
    }
    else {
      return svr;
    }
  }));

  return retModel;
}


