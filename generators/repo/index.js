'use strict';

var Generator = require('yeoman-generator');

module.exports = Generator.extend({

  prompting: {
    repo_prompt () {
      // handle git repo stuff
      var prompt = {
        type: 'list',
        name: 'gitHost',
        message: 'Would you like to host the repository for this project?',
        choices: [
          {
            name: 'Nope',
            value: 'None'
          },
          {
            name: 'Yes, on GitHub',
            value: 'GitHub'
          },
          {
            name: 'Yes, on GitLab',
            value: 'GitLab'
          }
        ],
        default: this.options.useOrg
      };

      return this.prompt(prompt).then(function (answers) {
        if (answers.gitHost === 'GitHub') {
          this.composeWith('github-create:authenticate');
          this.composeWith('github-create:create', {'description': this.config.get('description')});
        }

        else if (answers.gitHost === 'GitLab') {
          this.composeWith('stuffed-node:gitlab');
        }
      }.bind(this));
    }
  }
});
