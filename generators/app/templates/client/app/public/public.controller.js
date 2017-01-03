'use strict';

angular.module('templateApp').

controller('PublicCtrl', function ($scope, $resource) {
  $scope.items = $resource('/api/public').query();
});
