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
//dev server for running the mock backend
//run with "node server.js" in terminal

var express = require('express');
//var jsonServer = require('json-server');

var port = process.env.PORT || 3000;
var server = express();

server.use(express.static('./public'));

server.listen(port);
console.log('Cloud deployer server listening on port ' + port);  // eslint-disable-line no-console
