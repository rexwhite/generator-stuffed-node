'use strict';

angular.module('<%= module %>').

controller('PrivateCtrl', function ($scope, $resource) {
  $scope.items = $resource('/api/private').query();
});
