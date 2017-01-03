'use strict';

var path = require('path');

module.exports = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  ip: process.env.IP,

  // Root path
  root: path.normalize(__dirname + '/../..')
};
