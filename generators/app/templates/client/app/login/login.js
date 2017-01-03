'use strict';

angular.module('templateApp').

config(function ($stateProvider) {
  $stateProvider.
  state('main.login', {
    url: '/login',
    templateUrl: 'app/login/login.html',
    controller: 'LoginCtrl',

    // title and meta tags for <head> of index.html for this state
    html_head: {
      title: 'Login'
    }
  });
});
