'use strict';

angular.module('templateApp').

service('User', function ($http) {

  var _user = {};
  var user = {};

  _user.login = function (username, password) {
    $http.post('/auth/local', {username: username, password: password}).
    then(function success(resp) {
      angular.merge(user, resp.data);
    });
  };

  _user.logout = function () {
    $http.get('/auth/logout').
    then(function success(resp) {
      angular.copy(_user, user);
    });
  };

  // initialize user object...
  angular.copy(_user, user);

  $http.get('/api/users/me').
  then(function success(resp) {
    angular.merge(user, resp.data);
  });

  return user;
});
