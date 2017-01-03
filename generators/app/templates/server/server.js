'use strict';

var config = require('./config');
var app = require('express')();


//------------------------
// Set up the http server
//------------------------
var server = require('http').createServer(app);

require('./config/express')(app);
require('./config/routes')(app);

server.listen(config.port, config.ip, function () {
  console.log('Express is up and listening on port %d.', this.address().port);
});


//-----------------------------------------------
// Use the code below if you want to force https
//-----------------------------------------------
var redir = require('http');

redir.createServer(function(req, res){
  res.writeHead(302,  {Location: 'https://localhost:9090' + req.url});
  res.end();
}).listen(8000, function () {
  console.log('Redirecting port %d to https.', this.address().port);
});


//-------------------------
// Set up the https server
//-------------------------
var https = require('https');
var fs = require('fs');

var options = {
  key: fs.readFileSync('server/certs/ws.key'),
  cert: fs.readFileSync('server/certs/ws.cert')
};

https.createServer(options, app).listen(9090, function() {
  console.log('listening on port %d for https as well...', this.address().port);
});
