'use strict';

angular.module('<%= module %>').

controller('MainCtrl', function ($scope, User) {
  var loginForm = {isOpen: false};
  $scope.loginForm = loginForm;

  $scope.user = User;

  $scope.login = function () {
    User.login($scope.user.username, $scope.user.password);

    // close dropdown
    loginForm.isOpen = false;
  };
});
