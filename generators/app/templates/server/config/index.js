'use strict';

var path = require('path');

module.exports = {
  env: process.env.NODE_ENV || 'dev',
  port: process.env.NODE_PORT || 9000,
  ip: process.env.NODE_IP || '0.0.0.0',

  // Root path
  root: path.normalize(__dirname + '/../..')
};
