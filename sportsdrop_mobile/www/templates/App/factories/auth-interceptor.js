angular.module('factory.authinterceptor', [])

  .factory('AuthInterceptor', function ($rootScope, $q, AuthEvents) {
    return {
      responseError: function (response) {
        $rootScope.$broadcast({
          401: AuthEvents.notAuthorized,
          403: AuthEvents.notAuthenticated,
        }[response.status], response);
        return $q.reject(response);
      }
    };
  });
