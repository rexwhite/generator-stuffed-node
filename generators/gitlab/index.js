'use strict';

var chalk = require('chalk');
var _ = require('lodash');
var Generator = require('yeoman-generator');
var gitConfig = require('../../gitconfig');
var shell = require('shellpromise');

// local stuff...
var get_namespaces = require('./getNamespaces');
var create_project = require('./createProject');


var gitlab_config, gitc;


module.exports = Generator.extend({
  initializing:
    function gitlab_initializing () {
      return gitConfig.get().then(function (config) {
        this.project_config = this.config.getAll() || {};
        this.gitlab_config = this.config.get('gitlab') || {};
        this.gitc = config;
        this.gitc.user = this.gitc.user || {};
      }.bind(this));
    },

  prompting:
    function gitlab_prompting () {
      var prompts = [
        {
          type: 'input',
          name: 'gitlab-token',
          message: 'Access Token' + chalk.magenta(' (see: https://gitlab.com/profile/personal_access_tokens)'),
          default: this.gitc.user['gitlabtoken']
        }
      ];

      // prompt for GitLab access token...
      return this.prompt(prompts).

      // prompt for group...
      then(function (answers) {
        // save gitlab username
        this.gitc.user['gitlabtoken'] = answers['gitlab-token'];

        // get group list
        return get_namespaces({token: this.gitc.user.gitlabtoken}).

        then(function (namespaces) {
          // get username from namespace list
          var user = _.find(namespaces, {kind: 'user'});
          var groups = _.filter(namespaces, {kind: 'group'});

          if (user) {
            this.gitc.user['gitlabuser'] = user.path;
            this.gitlab_config['gitlabuser'] = user.path;
            this.log(chalk.green('\nToken valid for user: ') + user.path + '\n');
          }

          // username/token worked, so save GitLab info in ~/.gitconfig
          gitConfig.set({'user': this.gitc.user}, {location: 'global'}); // asynchronous

          var prompts = [
            {
              when: groups.length,
              type: 'list',
              name: 'group',
              message: 'Group for this project',
              choices: function () {
                var choices = [{name: 'None (' + user.path + ')', value: user.id}];
                for (var index in groups) {choices.push({name: groups[index].path, value: groups[index].id})}
                return choices;
              }
            }
          ];

          return this.prompt(prompts).

          // prompt for project name...
          then(function (answers) {
            // save selected group
            this.gitlab_config['namespace_id'] = answers.group;

            var prompts = [
              {
                type: 'input',
                name: 'projectname',
                message: 'GitLab project name',
                default: this.project_config.name
              },
              {
                type: 'input',
                name: 'description',
                message: 'GitLab project description',
                default: this.project_config.description
              },
              {
                type: 'list',
                name: 'visibility',
                message: 'Visibility',
                choices: [
                  {
                    name: 'Private - Project access must be granted explicitly to each user.',
                    short: 'Private',
                    value: 0
                  },
                  {
                    name: 'Internal - The project can be cloned by any logged in user.',
                    short: 'Internal',
                    value: 10
                  },
                  {
                    name: 'Public - The project can be cloned without any authentication.',
                    short: 'Public',
                    value: 20
                  }
                ]
              }
            ];

            return this.prompt(prompts).

            // github-create GitLab project...
            then(function (answers) {
              this.gitlab_config['project_name'] = answers.projectname;
              this.gitlab_config['description'] = answers.description;
              this.config['visiboility'] = answers.visibility;
              return this.config.set('gitlab', this.gitlab_config);
            }.bind(this))
          }.bind(this))
        }.bind(this))

        .catch(function (err) {
          this.env.error('GitLab access token is invalid.');
          this.log(JSON.stringify(err));
        }.bind(this))

      }.bind(this))

    },

  default:
    function gitlab_default () {
      this.log(chalk.cyan('\nCreating GitLab project...'));

      return create_project({
        token: this.gitc.user.gitlabtoken,
        parameters: {
          name: this.gitlab_config.project_name,
          namespace_id: this.gitlab_config.namespace_id,
          description: this.gitlab_config.description,
          visibility_level: this.config.visibility
        }
      }).

      then(function (project) {
        // save some project data
        this.gitlab_config['project_id'] = project.id;
        this.gitlab_config['ssh_url'] = project.ssh_url_to_repo;
        this.gitlab_config['http_url'] = project.http_url_to_repo;
        this.gitlab_config['web_url'] = project.web_url;

        this.config.set('gitlab', this.gitlab_config);

        // initialize git repo
        this.log(chalk.cyan('Initializing git...'));
        return shell('git init').

        then(function (output) {
          return shell('git remote add origin ' + project.ssh_url_to_repo);
        }).

        catch(function (err) {
          this.env.error('Something went wrong initializing git...');
          this.log(JSON.stringify(err));
        }.bind(this))

      }.bind(this))

    },

  writing:
    function gitlab_writing () {
      // update package.json with repo info
      var pkg = this.fs.readJSON(this.destinationPath('package.json'), {});

      if (!pkg) {
        pkg = this.fs.readJSON(this.fs.writeJSON(this.destinationPath('package.json'), {}));
      }

      pkg.repository = {
        type: 'git',
        url: this.gitlab_config['ssh_url']
      };
      pkg.homepage = this.gitlab_config['web_url'];
      pkg.bugs = {
        url: pkg.homepage + '/issues'
      };

      this.fs.writeJSON(this.destinationPath('package.json'), pkg);
    },

  install:
    function gitlab_install () {
      this.log(chalk.cyan('Creating initial commit and pushing to GitLab...'));

      // commit and push to GitLab
      return shell('git add -A && git commit -m "Initial Commit"').

      then(function (output) {
        return shell('git push -u origin master')
      }).

      catch(function (err) {
        this.env.error('Something went wrong commiting and pushing...');
        this.log(JSON.stringify(err));
      }.bind(this))

    }
});
