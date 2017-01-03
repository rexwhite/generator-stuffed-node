'use strict';

var bcrypt = require('bcrypt');

var user = {
  'sparky': {
    password: '$2a$10$qqntvlUJaKS.cNCCygXf8Onjo.CBvQP/RnYC2uMBkoaDl1xSj0XYi', // 'password'
    name: 'Sparky Wiener',
    roles: ['admin']
  },
  'binky': {
    password: '$2a$10$1BM/RpQ6J.CI.qmeXMvT.eG7Qn7DGkgCAS3NAGnR9fywhvGm/5uAS', // 'blah'
    name: 'Lord Binky',
    roles: ['admin']
  }
};

// Verify the password for a given user (password stored as a secure hash).  Returns user object if password matches,
// otherwise returns null.
exports.authenticate = function (username, password) {
  if (bcrypt.compareSync(password, user[username].password))
    return {
      username: username,
      name: user[username].name,
      roles: user[username].roles,
      loggedIn: true  // this is just a convenience item for the client UI
    };

  return null;
};
