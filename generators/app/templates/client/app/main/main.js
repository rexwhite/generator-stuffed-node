'use strict';

angular.module('<%= module %>').

config(function ($stateProvider) {

  $stateProvider.
  state('main', {
    templateUrl: 'app/main/main.html',
    controller: 'MainCtrl',
    abstract: true
  });

});
