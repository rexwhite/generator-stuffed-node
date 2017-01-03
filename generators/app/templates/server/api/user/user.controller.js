'use strict';

// Return details about logged in user
exports.me = function (req, res) {
  return res.json(req.user);
};
