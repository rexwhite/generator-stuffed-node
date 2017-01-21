'use strict';

module.exports = function (grunt) {

  // auto-load grunt plugins
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({


    //-------------------------
    // Clean up various things
    //-------------------------
    clean: {
      jade: ['.tmp/**/*.html'],
      dev: ['dev'],
      prod: ['prod', '.tmp']
    },


    //-----------------------
    // Compiles Jade to html
    //-----------------------
    jade: {
      compile: {
        options: {
          pretty: true,
          data: {
            debug: false
          }
        },
        files: [{
          expand: true,
          src: [
            'client/{app,components}/**/*.jade'
          ],
          dest: '.tmp',
          ext: '.html'
        }]
      }
    },


    //------------
    // copy files
    //------------
    sync: {
      dev: {
        files: [
          {expand: true, src: ['server/**/*'], dest: 'dev'},
          {expand: true, src: ['client/**/*.{html,js,ico,css}', '!client/assets/**'], dest: 'dev'},
          {expand: true, src: ['client/assets/**'], dest: 'dev'},
          {expand: true, cwd: '.tmp', src: ['**'], dest: 'dev'},
          {expand: true, src: ['package.json', 'bower.json'], dest: 'dev'},
          {expand: true, src: ['node_modules/**'], dest: 'dev'},
          {expand: true, src: ['client/bower_components/**'], dest: 'dev'}
        ],
        updateAndDelete: true
      },

      prod: {
        files: [
          {expand: true, src: ['package.json'], dest: 'prod'},
          {expand: true, src: ['server/**/*'], dest: 'prod'},
          {expand: true, cwd: 'dev', src: ['client/**/index.html'], dest: 'prod'}
        ],
        updateAndDelete: true
      }
    },


    //-----------------------------------------
    // Inject bower components into index.html
    //-----------------------------------------
    wiredep: {
      target: {
        src: ['dev/client/index.html'],
        exclude: [/bootstrap.js/, /jquery.js/],
        options: {
          cwd: 'dev/'
        }
      }
    },


    //------------------------------------------
    // inject project .js files into index.html
    //------------------------------------------
    injector: {

      // Inject application script files into index.html (doesn't include bower)
      scripts: {
        options: {
          starttag: '<!-- injector:scripts_begin -->',
          endtag: '<!-- injector:scripts_end -->',
          ignorePath: 'client/',
          addRootSlash: false
        },
        files: {
          'dev/client/index.html': ['client/app/app.js', 'client/{app,components}/**/*.js']
        }
      },

      // Inject component css into index.html (doesn't include bower)
      css: {
        options: {
          starttag: '<!-- injector:css_begin -->',
          endtag: '<!-- injector:css_end -->',
          ignorePath: 'client/',
          addRootSlash: false
        },
        files: {
          'dev/client/index.html': ['client/{app,components}/**/*.css']
        }
      }
    },


    //---------------------------------
    // Express server to run our code
    //---------------------------------
    express: {
      dev: {
        options: {
          script: './dev/server/server.js',
          port: 9000,
          node_env: 'dev'
        }
      }
    },


    //----------------------------------------------------
    // Watch for changes to files and handle accordingly
    //----------------------------------------------------
    watch: {
      grunt: {
        files: ['Gruntfile.js']
      },

      jade: {
        files: ['client/{app,components}/**/*.jade'],
        tasks: ['clean:jade', 'jade']
      },

      sync: {
        files: ['server/**', 'client/**', '!client/**/*.jade', '.tmp/**', 'package.json'],
        tasks: ['sync:dev']
      },

      wiredep: {
        files: ['bower.json'],
        tasks: ['wiredep']
      },

      injector: {
        files: ['client/**/*.js'],
        tasks: ['injector']
      },

      express: {
        files: ['server/**/*.js'],
        tasks: ['express'],
        options: {
          spawn: false
        }
      },

      frontend: {
        files: ['dist/client/**'],
        options: {
          livereload: true
        }
      }
    },

    //----------------------------------------------------------------------------------------
    //                       ---------- Production Stuff ----------
    //----------------------------------------------------------------------------------------

    cdnify: {
      options: {
        cdn: require('./cdn_versions')
      },
      prod: {
        html: ['prod/client/index.html'],
        bower: 'prod/bower.json'
      }
    },

    useminPrepare: {
      options: {
        dest: 'prod/client'
      },
      html: 'dev/client/index.html'
    },

    ngtemplates: {
      app: {
        cwd: 'dev/client',
        src: ['**/*.html', '!index.html', '!bower_components/**/*.html'],
        dest: '.tmp/templates.js',
        options: {
          module: '<%= module %>',
          htmlmin: {
            // keepClosingSlash:              true,  // enable this for svg
            collapseBooleanAttributes:     true,
            collapseWhitespace:            true,
            removeAttributeQuotes:         true,
            removeComments:                true,  // remove this if you're using comment directives
            removeEmptyAttributes:         true,
            removeRedundantAttributes:     true,
            removeScriptTypeAttributes:    true,
            removeStyleLinkTypeAttributes: true
          },
          usemin: 'app.js'
        }
      }
    },


    postcss: {
      options: {
        processors: [
          // require('postcss-uncss')({html: 'dev/client/**/*.html'}),
          require('autoprefixer')(),
          require('cssnano')()
        ]
      },
      prod: {
        files: {
          'prod/client/app.css': '.tmp/concat/app.css',
          'prod/client/vendor.css': '.tmp/concat/vendor.css'
        }
      }
    },

    uncss: {
      prod: {
        files: {
          '.tmp/concat/vendor.css': ['dev/client/**/*.html', '!dev/client/bower_components/**/*.html'],
          '.tmp/concat/app.css': ['dev/client/bower_components/**/*.html']
        }
      }
    },

    // Allow the use of non-minsafe AngularJS files. Automatically makes it
    // minsafe compatible so Uglify does not destroy the ng references
    ngAnnotate: {
      options: {
        singleQuotes: true
      },
      prod: {
        files: [{
          expand: true,
          cwd: '.tmp/concat',
          src: '**/*.js',
          dest: '.tmp/concat'
        }]
      }
    },

    usemin: {
      html: 'prod/client/index.html'
    }

  });


  grunt.registerTask('default', ['serve']);

  grunt.registerTask('build', function (target) {
    if (target === 'dev') {
      return grunt.task.run([
        'clean:jade',
        'jade',
        'sync:dev',
        'wiredep',
        'injector'
      ]);
    }

    else if (target === 'prod') {
      return grunt.task.run([
        'clean:prod',
        'build:dev',
        'sync:prod',
        'useminPrepare',
        'ngtemplates',
        'concat:generated',
        'ngAnnotate',
        // 'uncss',
        'postcss',
        'uglify:generated',
        'usemin'
      ])
    }
  });

  grunt.registerTask('serve', ['build:dev', 'express:dev', 'watch']);
};
