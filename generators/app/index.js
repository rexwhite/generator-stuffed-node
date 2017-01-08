'use strict';
var Generator = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var camelCase = require('camel-case');
var gitConfig = require('gitconfig');

module.exports = Generator.extend({
  initializing: function () {
    return gitConfig.get().then(function (config) {
      this.gitc = config;
      this.gitc.user = this.gitc.user || {};
    }.bind(this));
  },

  prompting: function () {
    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the ' + chalk.red('stuffed-node') + ' generator!'
    ));

    var prompts = [
      {
        type: 'input',
        name: 'name',
        message: 'Project name',
        default: this.appname
      },
      {
        type: 'input',
        name: 'description',
        message: 'Project description',
        default: 'My groovy project!'
      },
      {
        type: 'input',
        name: 'author',
        message: 'Author name',
        default: this.gitc.user.name
      },
      {
        type: 'input',
        name: 'email',
        message: 'Author email address',
        default: this.gitc.user.email
      },
      {
        type: 'input',
        name: 'website',
        message: 'Company website (optional)',
        store: true
      }
    ];

    return this.prompt(prompts)

      .then(function (props) {
        // To access props later use this.props.someAnswer;
        this.props = props;
        this.props.module = camelCase(props.name + 'App');

        // save values
        this.config.set(this.props);

        // Get license type
        this.composeWith(require.resolve('generator-license/app'), {
          name: props.author,
          email: props.email,
          website: props.website
        });

        // handle GitHub/Lab repo creation
        this.composeWith('stuffed-node:repo');
      }

      .bind(this));

  },

  writing: function () {
    // copy template files
    this.fs.copyTpl(
      this.templatePath(),
      this.destinationPath(),
      this.props,
      {},
      {globOptions: {dot: true}}
    );

    // copy non-template files (like .png's)
    this.fs.copy(
      this.templatePath('../fixed'),
      this.destinationPath(),
      { globOptions: { dot: true } }
    );
  },

  install: function () {
    // this.installDependencies();
  }
});
