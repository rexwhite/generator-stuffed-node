/**
 * Get git config values.
 * @function get
 * @param {string} [namespace] - Namespace to get.
 * @param {object} options - Optional settings.
 * @param {string} [options.location] - Config file location. (global, system, or local)
 * @returns {Promise}
 */

'use strict';

var childProcess = require('child_process');
var os = require('os');

var Promise = require('bluebird');
var argx = require('argx');
var unflatten = require('flat').unflatten;

/** @lends get */
function get (key, options) {
  var args = argx(arguments);

  if (args.pop('function')) {
    throw new Error('Callback is no more supported. Use promise interface instead.')
  }

  options = args.pop('object') || {};
  key = args.shift('string') || null;

  var cmd = _getCommand(options.location);

  return new Promise(function (resolve, reject) {
      childProcess.exec(cmd, function (err, stdout, stderr) {
          return (err || stderr) ? reject(err || stderr) : resolve(_parseStdout(stdout, key));
        }
      )
    }
  );
}

get.sync = function (namespace, options) {
  var args = argx(arguments);
  options = args.pop('object') || {};
  namespace = args.shift('string') || null;
  var cmd = _getCommand(options.location);
  var stdout = childProcess.execSync(cmd);
  return _parseStdout(stdout, namespace);
};

function _getCommand (location) {
  var cmd = 'git config --list';
  if (location) {
    cmd += (' --' + location);
  }
  return cmd
}

function _parseStdout (stdout, namespace) {
  var config = {};

  String(stdout).split(os.EOL)
    .filter(function (line) {return !!line})
    .forEach(function (line) {
      var parts = line.split('=');

      if (parts[1] === undefined) {
        return;
      }

      config[ parts[0] ] = parts[1];
    });

  config = unflatten(config);

  if (namespace) {
    var namespaceSplit = namespace.split('.');
    namespaceSplit.forEach(function (namespace) {
      config = config[ namespace ]
    })
  }
  return config
}

module.exports = get;
