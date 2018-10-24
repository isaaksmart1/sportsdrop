angular.module('factory.statehandler', [])

  .factory('StateHandler', function ($rootScope, $state, $window, App, AuthService, SessionIntercept) {
    on = function () {

      // check if user is authenticated before initializing the app
      if (!AuthService.isAuthenticated())
        $state.go('login');
      else {
        App.initConfig();
        $state.go('home');
      }

      $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState) {

        $rootScope.$state = $state;
        // first state is always the login state
        if (toState.name === 'login') {
          if (ionic.Platform.isWebView()) {
            screen.lockOrientation('portrait');
            StatusBar.backgroundColorByHexString('#128dd4');
            window.plugins.headerColor.tint('#3b53ba');
          }
          SessionIntercept.stopExpiryChecker();
        }

        // same as above but for state transitioning
        if (!AuthService.isAuthenticated()) {
          if (toState.name !== 'login' && toState.name !== 'register' &&
            toState.name !== 'resetpass') {
            event.preventDefault();
            $state.go('login');
          }
        } else {
          switch (toState.name) {
            case 'home':
              if (ionic.Platform.isWebView())
                screen.lockOrientation('portrait');
              SessionIntercept.startExpiryChecker();
              break;
            default:
              if (ionic.Platform.isWebView())
                screen.unlockOrientation();
              SessionIntercept.startExpiryChecker();
              break;
          }
        }
      });
    };

    return {
      $on: on
    };
  });
