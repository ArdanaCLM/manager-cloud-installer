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
import { getAppConfig } from './ConfigHelper.js';

/**
 * Perform a fetch from a REST endpoint, convert the fetched JSON into a Javascript object, and return
 * a promise
 *
 * @param {String} url - URL or partial URL (one without the leading http).  If a partial URL
 *                       is received the request will be directed to the "shim".
 * @param {Object} init - optional argument that will be passed to the fetch() function.  It often
 *                       will contain HTTP headers when supplied.
 */
export function fetchJson(url, init) {

  const myUrl = buildUrl(url);

  let myInit = {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
  };

  if (init) {
    myInit = Object.assign(myInit, init);
  }

  return fetch(myUrl, myInit)
    .then(res => {
      if (res.ok) {
        return res.json();
      } else {
        return Promise.reject(res.statusText);
      }
    });
}

/**
 * Perform a post from a REST endpoint, converting the passed body to JSON, and return the result
 * as a promise
 *
 * @param {String} url - URL or partial URL (one without the leading http).  If a partial URL
 *                       is received the request will be directed to the "shim".
 * @param {Object} body - Javascript object that will be converted to Json and posted to the URL.  If body
 *                        is undefined, then an empty string will be POSTed
 * @param {Object} init - optional argument that will be passed to the fetch() function.  It often
 *                        will contain HTTP headers when supplied.
 */
export function postJson(url, body, init) {

  const myUrl = buildUrl(url);

  let myInit = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  };
  if (init) {
    myInit = Object.assign(myInit, init);
  }

  if (! ('body' in myInit)) {
    if (body === undefined) {
      myInit.body = '';
    } else if (typeof(body) === 'string') {
      myInit.body = body;
    } else {
      myInit.body = JSON.stringify(body);
    }
  }

  return fetch(myUrl, myInit)
    .then(res => {
      if (res.ok) {
        return Promise.resolve('Success');
      } else {
        return Promise.reject(res.statusText);
      }
    });
}

function buildUrl(url) {

  if (url.startsWith('http')) {
    return url;
  }

  // prepend the shimurl if we receive a URL without a scheme.  Note that the incoming
  // url may contain a leading / but is not required to.
  return getAppConfig('shimurl') + '/' + url.replace(/^\//, '');
}
