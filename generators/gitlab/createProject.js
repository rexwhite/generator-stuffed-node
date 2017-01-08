'use strict';

var request = require('request-promise');

module.exports = function (args) {
  var options = {
    method: 'POST',
    uri: 'https://gitlab.com/api/v3/projects',
    body: args.parameters,
    headers: {
      'PRIVATE-TOKEN': args.token,
      'User-Agent': 'Request-Promise'
    },
    json: true
  };

  return request(options);
};
