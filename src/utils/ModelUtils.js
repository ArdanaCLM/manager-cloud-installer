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
    .map(group => group.get('name'));
  return groups;
}

export function getNicMappings(model) {
  return model.getIn(['inputModel','nic-mappings'])
    .sort((a,b) => alphabetically(a.get('name'), b.get('name')))
    .map(nic => nic.get('name'));
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

// function byServerNameOrId(a,b) {
//   return alphabetically(a['name'] || a['id'], b['name'] || b['id']);
// }

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

