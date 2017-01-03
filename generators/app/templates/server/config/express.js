/**
 * Set up an express app
 */

'use strict';

var express = require('express');
var compression = require('compression');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var serveFavicon = require('serve-favicon');
var session = require('cookie-session');
var passport = require('passport');

var path = require('path');
var config = require('./');

module.exports = function (app) {
  // hide the fact that we're using Express
  app.set('x-powered-by', false);

  app.use(compression({}));

  // Serve our favicon
  app.use(serveFavicon(path.join(config.root, 'client/assets/images/xer-t.png')));

  // insert livereload middleware in development mode
  if ('dev' === app.get('env')) {
    console.log('Loading connect-livereload...');
    app.use(require('connect-livereload')());
  }

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(methodOverride());
  app.use(cookieParser());

  // cookie-session middleware to save session info in browser cookies
  app.use(session({
    //cookieName: 'user',
    secret: 'blahblahblah',
    httpOnly: false,
    signed: false
  }));
};
