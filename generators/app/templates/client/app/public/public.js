'use strict';

angular.module('templateApp').

config(function ($stateProvider) {
  $stateProvider.
  state('main.public', {
    url: '/public',
    templateUrl: 'app/public/public.html',
    controller: 'PublicCtrl',

    // title and meta tags for <head> of index.html for this state
    html_head: {
      title: 'Public',
      meta: [
        {
          name: 'description',
          content: 'description of Public page'
        }
      ]
    }
  });
});
