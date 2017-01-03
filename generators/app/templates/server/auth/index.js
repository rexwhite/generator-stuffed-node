'use strict';

var router = require('express').Router();
var passport = require('passport');
var jwt = require('jsonwebtoken');
var secret = 'blahblahblah';

// configure passport auth strategies
require('./local/passport');

module.exports = function (app) {
  // insert passport middleware to handle authentication
  app.use(passport.initialize());
  app.use(passport.session());

  // wire up login routes for each auth strategy
  router.use('/local', require('./local'));

  // add global logout route
  router.use('/logout', function (req, res) {
    req.logout();
    return res.status(200).end();
  });


  // session serialization functions
  passport.serializeUser(function (user, done) {
    // convert 'user' into a JWT.  It will get stored in our session cookie.
    var token = jwt.sign(user, secret);
    done(null, token);
  });

  passport.deserializeUser(function (token, done) {
    // 'id' is the JWT from our session cookie.  Convert it back into a 'user'.
    try {
      var user = jwt.verify(token, secret);
      done(null, user);
    }

    catch (err) {
      console.log('Bad JWT: %s', token);
      done(null, null)
    }
  });

  return router;
};
