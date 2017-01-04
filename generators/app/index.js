'use strict';
var Generator = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var camelCase = require('camel-case');

module.exports = Generator.extend({
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
        default: 'My groovy new project!'
      }
    ];

    return this.prompt(prompts).then(function (props) {
      // To access props later use this.props.someAnswer;
      this.props = props;
      this.props.module = camelCase(props.name + 'App');
    }.bind(this));
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
    this.installDependencies();
  }
});
