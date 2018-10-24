angular.module('factory.sessionintercept', [])

  .factory('SessionIntercept', function ($rootScope, $q, $interval, AuthService) {
    function hrMinSec(hr, min, sec) {
      hr = hr * 3600;
      min = min * 60;
      sec = sec * 1;
      return hr + min + sec;
    }
    var millis = 1000;
    var timer = hrMinSec(0, 10, 0) * millis;
    var session;
    return {
      startExpiryChecker: function () {
        session = $interval(function () {
          AuthService.checkSessionExpiration();
        }, timer);
      },
      stopExpiryChecker: function () {
        if (session)
          $interval.cancel(session);
      }
    };
  });
