'use strict';

angular.module('<%= module %>').

controller('PublicCtrl', function ($scope, $resource) {
  $scope.items = $resource('/api/public').query();
});
