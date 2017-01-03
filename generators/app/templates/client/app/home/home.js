'use strict';

angular.module('templateApp').

config(function($stateProvider) {
  $stateProvider.
  state('main.home', {
    url: '/',
    templateUrl: 'app/home/home.html',
    controller: 'HomeCtrl',

    // title and meta tags for <head> of index.html for this state
    html_head: {
      title: 'Home',
      meta: [
        {
          name: 'description',
          content: 'description of Home page'
        }
      ]
    }
  });
});
