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

/*
 * Custom Dropdown that provides the ability to add an extra option, emptyOption, at the beginning of the
 * list when no option has yet been selected, and which uses the same styling as ServerDropdown
 */
export default function Dropdown(props) {

  // Make a copy of props that can be modified to remove emptyOption and children
  // before passing along to the standard html <select> input
  let myProps = Object.assign({}, props);

  let emptyItem;
  if (props.emptyOption && props.value === undefined) {
    emptyItem = <option key='undefined' value='undefined'>{props.emptyOption}</option>;
  }

  const children = myProps.children;
  delete myProps.children;
  delete myProps.emptyOption;

  return (
    <div className="server-detail-select">
      <select className='rounded-corner' {...myProps}>
        {emptyItem}
        {children}
      </select>
    </div>
  );
}
