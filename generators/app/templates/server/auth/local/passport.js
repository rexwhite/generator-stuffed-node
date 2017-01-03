'use strict';

var passport = require('passport');
var LocalStrategy = require('passport-local');
var User = require('../../api/user/user.model');

passport.use(new LocalStrategy(
  function(username, password, done) {
    return done(null, User.authenticate(username, password));
  }
));
