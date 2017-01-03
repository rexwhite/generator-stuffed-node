'use strict';

angular.module('templateApp').

config(function ($stateProvider) {
  $stateProvider.
  state('main.private', {
    url: '/private',
    templateUrl: 'app/private/private.html',
    controller: 'PrivateCtrl',

    // title and meta tags for <head> of index.html for this state
    html_head: {
      title: 'Private',
      meta: [
        {
          name: 'description',
          content: 'description of Private page'
        }
      ]
    }
  });
});
