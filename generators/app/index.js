'use strict';
var Generator = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');

module.exports = Generator.extend({
  prompting: function () {
    // Have Yeoman greet the user.
    this.log(yosay(
      'Welcome to the divine ' + chalk.red('generator-stuffed-node') + ' generator!'
    ));

    var prompts = [{
      type: 'confirm',
      name: 'someAnswer',
      message: 'Would you like to enable this option?',
      default: true
    }];

    return this.prompt(prompts).then(function (props) {
      // To access props later use this.props.someAnswer;
      this.props = props;
    }.bind(this));
  },

  writing: function () {
    // copy template files
    this.fs.copyTpl(
      this.templatePath(),
      this.destinationPath(),
      { globOptions: { dot: true } }
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
