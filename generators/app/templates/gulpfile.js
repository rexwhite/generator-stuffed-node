'use strict';

require('array-includes').shim();  // because node 4.2.3 sucks....

var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

var gulp = require('gulp-help')(require('gulp'));

var gutil = require('gulp-util');
var watch = require('gulp-watch');
var jade = require('gulp-jade');
var filter = require('gulp-filter');
var inject = require('gulp-inject');
var bowerFiles = require('main-bower-files');
var vfs = require('vinyl-fs');
var nodemon = require('gulp-nodemon');
var livereload = require('gulp-livereload');

var merge = require('merge-stream');
var ngtemplates = require('gulp-ng-templates');
var annotate = require('gulp-ng-annotate');
var uglify = require('gulp-uglify');
var css_clean = require('gulp-clean-css');
var imagemin = require('gulp-imagemin');
var domSrc = require('gulp-dom-src');
var dom = require('gulp-dom');

var git = require('gulp-git');
var clean = require('gulp-dest-clean');
var newer = require('gulp-newer');
var preserve = require('gulp-preservetime');
var usemin = require('gulp-usemin');

var tags = require('./docker_branch_tags.json');

var dockerTag = 'default';
var gitBranch  = '';


//-----------------------------------------------------------------------------


gulp.task('clean:dev', false, function (){
  return exec('rm -rf ./dev');
});


//-----------------------------------------------------------------------------


// symlink node_modules -> dev/node_modules
var _link = function () {
  gulp.src('node_modules').
  pipe(vfs.symlink('dev'));
};

_link.description = gutil.colors.dim.gray('Create symbolic link in dev dir to node_modules.');

gulp.task('link', _link.description, ['clean:dev'], _link);


//-----------------------------------------------------------------------------


// Copy project files to dev directory
var _sync = function () {
  var jade_flt = filter(['client/**/*.jade'], {restore: true});

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
    .pipe(preserve())
  )
};

_sync.description = gutil.colors.dim.gray('Copy files to ./dev.');

gulp.task('sync', _sync.description, ['link'], _sync);


//-----------------------------------------------------------------------------

// inject project and vendor files into index.html
var _inject = function () {
  var stream = gulp.src('client/index.html')

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

  // create template.min.js file and inject
  .pipe(
    inject(                                 // inject ng-templates.js
      gulp.src([
        'dev/client/**/*.html',
        '!dev/client/index.html',
        '!dev/client/bower_components/**'
      ])
      .pipe(ngtemplates({                   // generate ng-template.js file
        module: '<%= name %>',
        standalone: false
      }))
      .pipe(gulp.dest('dev/client/app')),   // save generated ng-templates.js file
      {
        name: 'template',
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

_inject.description = gutil.colors.dim.gray('Inject css and scripts for app and bower components.');

gulp.task('inject', _inject.description, ['sync'], _inject);


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

_watch.description = gutil.colors.dim.gray('Keep ./dev files in sync.');

gulp.task('watch', _watch.description, ['inject'], _watch);


//-----------------------------------------------------------------------------


var _serve = function () {
  livereload.listen();

  nodemon({
    script: 'dev/server/server.js',
    watch: ['dev/server'],
    env: { 'NODE_ENV': 'dev' }
  });
};

_serve.description = gutil.colors.green('Serve project.');

gulp.task('serve', _serve.description, ['watch'], _serve);


//-----------------------------------------------------------------------------


// create app.js (with html templates) & app.css [annotated & minified]
function app () {

  return gulp.src('dev/client/index.html')  // augment dev/client/index.html...
  .pipe(usemin({
    app_js: [annotate(), uglify()],
    vendor_js: [uglify()],
    app_css: [css_clean()],
    vendor_css: [css_clean()]
  }))
  .pipe(gulp.dest('dist/client'));
};

//=========================

// create vendor.js & vendor.css [minified]
function vendor () {
  var other_flt = filter(['client/**/*.!(css|js|less|scss)'], {restore: true});

  return gulp.src(bowerFiles(), {base: 'client'})
  .pipe(other_flt)
  .pipe(gulp.dest('dist/client'));
};

//=========================

// minify images
function misc () {
  return merge (
    gulp.src([
      'dev/client/assets/**/*'
    ], {nodir: true, base: 'dev/client/assets'})
    .pipe(clean('dist/client/assets'))
    .pipe(newer('dist/client/assets'))
    .pipe(imagemin())
    .pipe(gulp.dest('dist/client/assets')),

    gulp.src(['dev/client/*', '!dev/client/index.html'], {nodir: true, base: 'dev'})
    .pipe(gulp.dest('dist'))
  )
};

//=========================

var _build = function () {
  return merge(
    app(),
    vendor(),
    misc(),

    gulp.src(['package.json', 'LICENSE', 'Dockerfile', '.dockerignore'])
    .pipe(gulp.dest('dist'))
    .pipe(preserve()),

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
};

_build.description = gutil.colors.green('Build production version of project.');
gulp.task('build', _build.description, ['inject'], _build);

//=========================

// Get docker tag for current git branch
gulp.task('image:_tag', false, function (done) {
  git.revParse({args:'--abbrev-ref HEAD', quiet: true}, function (err, branch) {
    if (err) throw(err);

    gitBranch = branch;
    dockerTag = tags[branch] || 'default';

    done();
  });
});


// Build Docker image with tag for current git branch
var _image_build = function (done) {
  gutil.log('Building image with tag:', gutil.colors.cyan(dockerTag));

  return spawn('docker', ['build', '.', '-t', dockerTag], {cwd: './dist', stdio: 'inherit'})
  .on('close', function () {
    done();
  });
};


_image_build.description = gutil.colors.green('Build tagged Docker image of dist.');
gulp.task('image:build', _image_build.description, ['build', 'image:_tag'], _image_build);


// Push docker image with tag for current git branch
gulp.task('image:push', 'Push image with current tag.', ['image:_tag'], function (done) {
  gutil.log('Pushing image:', gutil.colors.cyan(dockerTag));

  return spawn('docker', ['push', dockerTag], {stdio: 'inherit'})
  .on('close', function () {
    done();
  });
});


// Display Docker tag for current git branch
gulp.task('image', 'Displays tag for current branch.', ['image:_tag'], function () {
  console.log('\nTag for branch', gutil.colors.magenta(gitBranch), ':', gutil.colors.blue(dockerTag), '\n');
  console.log(gutil.colors.underline('Usage'), '\n');
  console.log(gutil.colors.cyan('  gulp image:build'), '- Build a tagged image with the contents of dist');
  console.log(gutil.colors.cyan('  gulp image:push'), ' - Push tagged image\n');
});

//-----------------------------------------------------------------------------


gulp.task('default', ['help']);
