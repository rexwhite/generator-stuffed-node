'use strict';

exports.list = function (req, res) {
  return res.json(['four', 'five', 'six']);
};
