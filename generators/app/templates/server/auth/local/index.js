'use strict';

var router = require('express').Router();
var passport = require('passport');

router.post('/', function(req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    if (err) return next(err);
    if (!user) return res.status(401).end();
    req.login(user, function (err) {
      if (err) return next(err);
      return res.json(user);
    });
  })(req, res, next);
});

module.exports = router;
