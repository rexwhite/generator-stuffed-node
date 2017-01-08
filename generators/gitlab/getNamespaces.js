'use strict';

var request = require('request-promise');

module.exports = function (args) {
  var options = {
    uri: 'https://gitlab.com/api/v3/namespaces',
    headers: {
      'PRIVATE-TOKEN': args.token,
      'User-Agent': 'Request-Promise'
    },
    json: true
  };

  return request(options);
};
