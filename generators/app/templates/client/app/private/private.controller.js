'use strict';

angular.module('templateApp').

controller('PrivateCtrl', function ($scope, $resource) {
  $scope.items = $resource('/api/private').query();
});
