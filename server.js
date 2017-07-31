//dev server for running the mock backend
//run with 'node server.js' in terminal

var express = require('express');
//var jsonServer = require('json-server');

var port = process.env.PORT || 3000;
var server = express();

server.use(express.static('./public'));

server.listen(port);
console.log('Cloud deployer server listening on port ' + port);
