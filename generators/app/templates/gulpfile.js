'use strict';

var fs = require('fs');
var path = require('path');

var gulp = require('gulp-help')(require('gulp'));
var watch = require('gulp-watch');
var jade = require('gulp-jade');
var filter = require('gulp-filter');
var inject = require('gulp-inject');
var bowerFiles = require('main-bower-files');
var vfs = require('vinyl-fs');
var chalk = require('chalk');
var nodemon = require('gulp-nodemon');
var livereload = require('gulp-livereload');


//-----------------------------------------------------------------------------


var _link = function () {
  gulp.src('node_modules').
  pipe(vfs.symlink('dev'));
};

_link.description = chalk.dim.gray('Create symbolic link in dev dir to node_modules.');

gulp.task('link', _link.description, _link);


//-----------------------------------------------------------------------------


var _inject = function () {
  return gulp.src('client/index.html').

  pipe(
    inject(
      gulp.src('client/{app,components}/**/*.{js,css}', {read: false}),
      {
        name: 'app',
        removeTags: true,
        ignorePath: 'client',
        addRootSlash: false
      })
  ).

  pipe(
    inject(
      gulp.src(bowerFiles().concat(['!**/bootstrap.js', '!**/jquery.js', '!**/angular.js']), {read: false}),
      {
        name: 'bower',
        removeTags: true,
        ignorePath: 'client',
        addRootSlash: false
      })
  ).

  pipe(gulp.dest('dev/client'));
};

_inject.description = chalk.dim.gray('Inject css and scripts for app and bower components.');

gulp.task('inject', _inject.description, _inject);


//-----------------------------------------------------------------------------


var _sync = function () {
  // sync server files
  gulp.src(['server/**', 'package.json'], {base: '.'}).
  pipe(gulp.dest('dev'));

  // sync client files
  var jade_flt = filter(['client/**/*.jade'], {restore: true});

  var stream = gulp.src(['client/**', '!client/index.html'], {base: '.'}).
  pipe(jade_flt).
  pipe(jade()).
  pipe(jade_flt.restore).
  pipe(gulp.dest('dev'));

  return stream;
};

_sync.description = chalk.dim.gray('Copy files to ./dev.');

gulp.task('sync', _sync.description, ['link', 'inject'], _sync);


//-----------------------------------------------------------------------------


var _watch = function () {
  // sync server files
  watch(['server/**', 'package.json'], {base: '.'}, function (file) {
    if (file.event === 'unlink') {
      fs.unlink(path.join('dev', file.relative));
    }
  }).
  pipe(gulp.dest('dev'));

  // sync client files
  var jade_flt = filter(['client/**/*.jade'], {restore: true});

  watch(['client/**', '!client/index.html'], {base: '.'}, function (file) {
    if (file.event === 'unlink') {
      fs.unlink(path.join('dev', file.relative));
    }
  }).
  pipe(jade_flt).
  pipe(jade()).
  pipe(jade_flt.restore).
  pipe(gulp.dest('dev')).
  pipe(livereload());

  // watch injectables
  watch(['client/{app,components}/**/*.{js,css}', 'bower.json'], {events: ['add', 'unlink']}, _inject).
  pipe(gulp.src('dev/client/index.html')).
  pipe(livereload());
};

_watch.description = chalk.dim.gray('Keep ./dev files in sync.');

gulp.task('watch', _watch.description, ['link', 'inject'], _watch);


//-----------------------------------------------------------------------------


var _serve = function () {
  livereload.listen();

  nodemon({
    script: 'dev/server/server.js',
    watch: ['dev/server'],
    env: { 'NODE_ENV': 'dev' }
  });
};

_serve.description = chalk.green('Serve project in development mode.');

gulp.task('serve', _serve.description, ['sync', 'watch'], _serve);


//-----------------------------------------------------------------------------


gulp.task('default', ['serve']);

