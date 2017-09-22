'use strict';

require('array-includes').shim();  // because node 4.2.3 sucks....

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

var merge = require('merge-stream');
var ngtemplates = require('gulp-ng-templates');
var concat = require('gulp-concat');
var annotate = require('gulp-ng-annotate');
var uglify = require('gulp-uglify');
var css_clean = require('gulp-clean-css');
var imagemin = require('gulp-imagemin');
var domSrc = require('gulp-dom-src');
var dom = require('gulp-dom');

var git = require('gulp-git');
var clean = require('gulp-dest-clean');
var newer = require('gulp-newer');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

//-----------------------------------------------------------------------------


// symlink node_modules -> dev/node_modules
var _link = function () {
  gulp.src('node_modules').
  pipe(vfs.symlink('dev'));
};

_link.description = chalk.dim.gray('Create symbolic link in dev dir to node_modules.');

gulp.task('link', _link.description, _link);


//-----------------------------------------------------------------------------

// inject project and vendor files into index.html
var _inject = function () {
  var stream =  gulp.src('client/index.html')

  // inject app js & css
  .pipe(
    inject(
      gulp.src('client/{app,components}/**/*.{js,css}', {read: false}),
      {
        name: 'app',
        removeTags: true,
        ignorePath: 'client',
        addRootSlash: false
      })
  )

  // inject vendor js & css
  .pipe(
    inject(
      gulp.src(bowerFiles(), {buffer: false, base: '.'}).pipe(gulp.dest('dev')),
      {
        name: 'bower',
        removeTags: true,
        ignorePath: 'dev/client',
        addRootSlash: false
      })
  )

  // remove duplicate scripts & css
  .pipe(dom(function () {
    var seen = [];

    // find all the <script> and <link rel="stylesheet"> tags
    var result = this.querySelectorAll('script,link[rel="stylesheet"]');

    for (var i = 0; i < result.length; i++) {
      var item = result[i];
      var path = (item.nodeName === 'SCRIPT' ? 'src' : 'href');

      // if we've already seen this file then remove the DOM node...
      if (seen.includes(item[path])) {
        item.remove();
      }
      // ...otherwise add the file to the 'seen' list
      else {
        seen.push(item[path]);
      }
    }

    // return de-duped html
    return this;
  }))

  .pipe(gulp.dest('dev/client'));

  return stream;
};

_inject.description = chalk.dim.gray('Inject css and scripts for app and bower components.');

gulp.task('inject', _inject.description, _inject);


//-----------------------------------------------------------------------------


// Copy project files to dev directory
var _sync = function () {
  var jade_flt = filter(['client/**/*.jade'], {restore: true});

  exec('rm -rf ./dev');

  return merge (
    // sync server files
    gulp.src(['server/**', 'package.json', 'LICENSE'], {base: '.'})
    .pipe(gulp.dest('dev')),

    // sync bower main files
    gulp.src(bowerFiles(), {base: '.'})
    .pipe(gulp.dest('dev')),

    // sync non-injected js
    domSrc({
      file: 'client/index.html',
      selector: 'script',
      attribute: 'src',
      options: {base: 'client', buffer: false}
    })
    .pipe(gulp.dest('dev/client')),

    // sync non-injected css
    domSrc({
      file: 'client/index.html',
      selector: 'link',
      attribute: 'href',
      options: {base: 'client', buffer: false}
    })
    .pipe(gulp.dest('dev/client')),

    // sync other client files
    gulp.src(['client/**', '!client/index.html', '!client/bower_components/**'], {base: '.'})
    .pipe(jade_flt)
    .pipe(jade())
    .pipe(jade_flt.restore)
    .pipe(gulp.dest('dev'))
  )
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
  })
  .pipe(gulp.dest('dev'));

  // sync client files
  var jade_flt = filter(['client/**/*.jade'], {restore: true});

  watch(['client/**', '!client/index.html'], {base: '.'}, function (file) {
    if (file.event === 'unlink') {
      fs.unlink(path.join('dev', file.relative));
    }
  })

  .pipe(jade_flt)
  .pipe(jade())
  .pipe(jade_flt.restore)
  .pipe(gulp.dest('dev'))
  .pipe(livereload());

  // watch injectables
  watch(['client/{app,components}/**/*.{js,css}'], {events: ['add', 'unlink']}, _inject)
  .pipe(gulp.src('dev/client/index.html'))
  .pipe(livereload());

  // watch index.html & bower.json
  watch(['client/index.html', 'bower.json'], _inject)
  .pipe(gulp.src('dev/client/index.html'))
  .pipe(livereload());
};

_watch.description = chalk.dim.gray('Keep ./dev files in sync.');

gulp.task('watch', _watch.description, ['sync'], _watch);


//-----------------------------------------------------------------------------


var _serve = function () {
  livereload.listen();

  nodemon({
    script: 'dev/server/server.js',
    watch: ['dev/server'],
    env: { 'NODE_ENV': 'dev' }
  });
};

_serve.description = chalk.green('Serve project.');

gulp.task('serve', _serve.description, ['watch'], _serve);


//-----------------------------------------------------------------------------




//=========================

// create app.js (with html templates) & app.css [annotated & minified]
function app () {
  var js_flt = filter(['dev/client/**/*.js'], {restore: true});
  var css_flt = filter(['dev/client/**/*.css'], {restore: true});

  return merge(
    // jade -> *html ==> template.js
    gulp.src(['dev/client/**/*.html', '!dev/client/index.html', '!dev/client/bower_components/**'])
      .pipe(ngtemplates({module: '<%= name %>', standalone: false})),

    gulp.src(['dev/client/**/*.{js,css}', '!dev/client/bower_components/**'])
  )

    .pipe(js_flt)
    .pipe(concat('app.js'))
    .pipe(annotate())
    .pipe(uglify())
    .pipe(js_flt.restore)

    .pipe(css_flt)
    .pipe(concat('app.css'))
    .pipe(css_clean())
    .pipe(css_flt.restore)

    .pipe(gulp.dest('dist/client'));  // --> dist/client/app.js
};

//=========================

// create vendor.js & vendor.css [minified]
function vendor () {
  var js_flt = filter(['client/**/*.js'], {restore: true});
  var css_flt = filter(['client/**/*.css'], {restore: true});
  var other_flt = filter(['client/**/*.!(css|js|less|scss)'], {restore: true});

  return gulp.src(bowerFiles(), {base: 'client'})

    .pipe(js_flt)
    .pipe(concat('vendor.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist/client')) // --> dist/client/vendor.js
    .pipe(js_flt.restore)

    .pipe(css_flt)
    .pipe(concat('vendor.css'))
    .pipe(css_clean())
    .pipe(gulp.dest('dist/client')) // --> dist/client/vendor.css
    .pipe(css_flt.restore)

    .pipe(other_flt)
    .pipe(gulp.dest('dist/client'));
};

//=========================

// minify images
function misc () {
  return merge (
    gulp.src([
      'client/**/*',
      '!client/bower_components/**/*',
      '!client/**/*.{html,js,css}'
      ], {nodir: true})
    .pipe(clean('dist/client'))
    .pipe(newer('dist/client'))
    .pipe(imagemin())
    .pipe(gulp.dest('dist/client'))
    // TODO: .ico's?
  )
};

//=========================

gulp.task('sync:dist', false, ['sync'], function() {
  return merge(
    app(),
    vendor(),
    misc(),

    gulp.src(['package.json', 'LICENSE', 'Dockerfile', '.dockerignore'])
    .pipe(gulp.dest('dist')),

    gulp.src('server/**/*')
    .pipe(gulp.dest('dist/server')),

    // sync non-injected js
    domSrc({
      file: 'client/index.html',
      selector: 'script',
      attribute: 'src',
      options: {base: 'client', buffer: false}})
      .pipe(gulp.dest('dist/client')),

    // sync non-injected css
    domSrc({
      file: 'client/index.html',
      selector: 'link',
      attribute: 'href',
      options: {base: 'client', buffer: false}})
      .pipe(gulp.dest('dist/client'))
  )
});

//=========================

var _build = function () {

  // todo: gulp-useref files outside inject block but within build block into concatenated version and annotate/minify them here

  var work = gulp.src('client/index.html')

  .pipe(
    inject(
      gulp.src('dist/client/app.{js,css}', {read: false}),
      {
        name: 'app',
        removeTags: true,
        ignorePath: 'dist/client',
        addRootSlash: false
      })
  )

  .pipe(
    inject(
      gulp.src('dist/client/vendor.{js,css}', {read: false}),
      {
        name: 'bower',
        removeTags: true,
        ignorePath: 'dist/client',
        addRootSlash: false
      })
  )

  .pipe(gulp.dest('dist/client')); // --> dist/client/index.html

  return work;
};

_build.decription = chalk.green('Build production version of project.');
gulp.task('build', _build.decription, ['sync:dist'], _build);

//=========================

const tags = require('./docker_branch_tags.json');

var _build_image = function (done) {
  // docker build -t <tag-for-branch> .
  git.revParse({args:'--abbrev-ref HEAD', quiet: true}, function (err, branch) {
    if (err) throw(err);

    spawn('docker', ['build', '.', '-t', tags[branch]], {cwd: './dist', stdio: 'inherit'})
      .on('exit', function () {
        done();
      });
  });
};

_build_image.decription = chalk.green('Build Docker image of dist.');
gulp.task('build:image', _build_image.decription, ['build'], _build_image);
// gulp.task('build:image', _build_image.decription, [], _build_image);


//-----------------------------------------------------------------------------


gulp.task('default', ['help']);
