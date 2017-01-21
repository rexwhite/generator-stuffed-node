'use strict';

var path = require('path');

module.exports = {
  env: process.env.NODE_ENV || 'dev',
  port: process.env.PORT || 9000,
  ip: process.env.IP || '0.0.0.0',

  // Root path
  root: path.normalize(__dirname + '/../..')
};
