'use strict';

// Make sure the user is logged in
exports.secure = function (req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).end();
  }

  return next();
};
