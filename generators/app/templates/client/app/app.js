'use strict';

angular.module('templateApp', [
  'ngResource',
  'ui.router',      // angular-ui router
  'ui.bootstrap'    // angular-ui bootstrap
]).

config(function ($urlRouterProvider, $locationProvider) {
  // set default app route
  $urlRouterProvider.otherwise('/');
  $locationProvider.html5Mode(true);
}).

run(function ($rootScope, $state, $window) {
  // expose $state globally (mostly se we can get to the meta tag and title info
  $rootScope.$state = $state;
  // expose Google Analytics for convenience
  $rootScope.ga = $window.ga;
});
