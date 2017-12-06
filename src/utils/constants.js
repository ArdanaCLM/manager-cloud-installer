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
export const STATUS = {
  UNKNOWN: -1,
  NOT_STARTED: 0,
  COMPLETE: 1,
  IN_PROGRESS: 2,
  FAILED: 3
};

export const INPUT_STATUS = {
  UNKNOWN: -1,
  VALID: 1,
  INVALID: 0
};

export const MODE = {
  EDIT: 'edit',
  ADD: 'add',
  NONE: 'none'
};

export const MODEL_SERVER_PROPS =  [
  'name', 'ip-addr', 'mac-addr' ,'server-group' ,'nic-mapping' ,'ilo-ip' ,'ilo-user', 'ilo-password'
];

export const MODEL_SERVER_PROPS_ALL = MODEL_SERVER_PROPS.concat(['role','id']);

export const PLAYBOOK_PROGRESS_UI_STATUS = {
  NOT_STARTED: 'notstarted',
  FAILED: 'fail',
  COMPLETE: 'succeed',
  IN_PROGRESS: 'progressing'
};
