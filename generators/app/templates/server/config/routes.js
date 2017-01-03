'use strict';

var express = require('express');

var path = require('path');
var config = require('./');

module.exports = function (app) {
  var root = config.root;

  // Set up the default static routes for index.html, resources, bower_components, etc here.
  app.use(express.static(path.join(root, 'client')));

  // auth initialization and routes
  app.use('/auth', require('../auth')(app));

  // API routes
  app.use('/api/private', require('../api/private'));
  app.use('/api/public', require('../api/public'));
  app.use('/api/users', require('../api/user'));

  // If we're looking for an asset that didn't exist, return a 404
  app.route('/:url(api|app|assets|bower_component)/*').
  all(function (req, res) {
    return res.status(404).json({message: 'Could not find: ' + req.url});
  });

  // If we get this far then no other routes matched so ust return index.html...
  app.route('/*').
  get(function (req, res) {
    res.sendFile(path.join(root, 'client/index.html'));
  });
};
