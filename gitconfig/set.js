/**
 * Set git config values.
 * @function set
 * @param {string} key - Key to set.
 * @param {string} val - Value to set.
 * @param {object} [options] - Optional settings.
 * @returns {Promise}
 */

'use strict';

var childProcess = require('child_process');

var Promise = require('bluebird');
var argx = require('argx');
var flatten = require('flat');

/** @lends set */
function set (key, val, options) {
  var args = argx(arguments);
  if (args.pop('function')) {
    throw new Error('Callback is no more supported. Use promise interface instead.')
  }
  var setting = args.shift('object') || {};
  key = args.shift('string');
  val = args.shift('string');
  if (key) {
    setting[ key ] = val
  }
  setting = flatten(setting);
  options = args.pop('object') || {};

  var queue = [];

  for (key in setting) {
    var cmd = 'git config';

    if (options.location) {
      cmd += ' --' + options.location;
    }

    queue.push(cmd + ' ' + key + ' ' + setting[key]);
  }

  return Promise.each(queue, function (cmd) {
    return new Promise(function (resolve, reject) {
      childProcess.exec(cmd, function (err, stdout, stderr) {
        return (err || stderr) ? reject(err || stderr) : resolve(stdout);
      })
    })
  });
}

module.exports = set;
