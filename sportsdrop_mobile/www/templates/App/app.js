angular.module('sportsdrop', [
    'ngCordova', 'ionic', 'client',
    'ionic-material', 'ionMdInput',
    'controller.login',
    'controller.resetpassword',
    'controller.register',
    'controller.menu',
    'controller.home',
    'service.authorization',
    'service.notificationlistener',
    'service.pushservice',
    'service.encryptdecrypt',
    'factory.appinit',
    'factory.authinterceptor',
    'factory.facebook',
    'factory.sessionintercept',
    'factory.socketconnect',
    'factory.statehandler',
    'templates'
  ])

  .controller('AppCtrl', function ($rootScope, $scope, $state, LocalHTTP,
    AuthService, AuthEvents, CustomUI, ionicMaterialInk) {

    // react to authorization issues
    $scope.$on(AuthEvents.notAuthorized, function (event) {
      $state.go('login');
      CustomUI.alert('Not Authorized');
      AuthService.logout(LocalHTTP.userName()).then(function () {});
    });

    // react to authentication issues
    $scope.$on(AuthEvents.notAuthenticated, function (event) {
      AuthService.logout(LocalHTTP.userName()).then(function () {
        $state.go('login');
        CustomUI.alert('Session Timeout');
      });
    });

    // apply ink effect to all styles
    $scope.inkColor = function () {
      return '#cccccc';
    };

    // apply platform id to all styles and icons
    if (ionic.Platform.isIOS()) {
      $rootScope.androidPlatform = false;
      $rootScope.platformID = 'ios';
    } else {
      $rootScope.androidPlatform = true;
      $rootScope.platformID = 'android';
    }

    ionicMaterialInk.displayEffect();
  })

  .config(function ($stateProvider, $httpProvider, $urlRouterProvider, $ionicConfigProvider) {
    $ionicConfigProvider.scrolling.jsScrolling(false);
    $stateProvider
      .state('login', {
        cache: false,
        url: '/login',
        templateUrl: 'templates/App/pages/login/login.html',
        controller: 'LoginCtrl'
      })
      .state('resetpass', {
        url: '/resetpass',
        templateUrl: 'templates/App/pages/password/password.html',
        controller: 'ResetPassCtrl'
      })
      .state('register', {
        url: '/register',
        templateUrl: 'templates/App/pages/register/register.html',
        controller: 'RegisterCtrl'
      })
      .state('home', {
        cache: false,
        url: '/home',
        templateUrl: 'templates/App/pages/home/home.html',
        controller: 'HomeCtrl'
      })
      .state('menu', {
        abstract: true,
        url: '/menu',
        templateUrl: 'templates/Menu/menu.html',
        controller: 'MenuCtrl'
      })
      .state('menu.map', {
        url: '/map',
        templateUrl: 'templates/Map/map.html',
        controller: 'MapCtrl'
      })
      .state('menu.activities', {
        cache: false,
        url: '/activities',
        templateUrl: 'templates/Activity/activities.html',
        controller: 'ActivityCtrl'
      })
      .state('menu.groups', {
        url: '/groups',
        templateUrl: 'templates/Groups/groups.html',
        controller: 'GroupCtrl'
      })
      .state('menu.settings', {
        url: '/settings',
        templateUrl: 'templates/Settings/settings.html',
        controller: 'OptCtrl'
      })
      .state('about', {
        url: '/settings/about',
        templateUrl: 'templates/Settings/pages/about/about.html'
      })
      .state('account', {
        url: '/settings/account',
        templateUrl: 'templates/Settings/pages/account/account.html'
      })
      .state('activities-details', {
        cache: false,
        url: 'activities/details',
        params: {
          Params: null
        },
        templateUrl: 'templates/Activity/pages/details/activity-info.html',
        controller: 'ActDetailsCtrl'
      })
      .state('community', {
        url: '/groups/community',
        templateUrl: 'templates/Groups/pages/community/community.html'
      })
      .state('new-group', {
        cache: false,
        url: '/groups/new-group',
        templateUrl: 'templates/Groups/pages/new-group/new-group.html'
      })
      .state('notifications', {
        url: '/settings/notifications',
        templateUrl: 'templates/Settings/pages/notifications/notifications.html'
      })
      .state('profile', {
        cache: false,
        url: '/settings/profile',
        templateUrl: 'templates/Settings/pages/profile/profile.html',
        params: {
          info: null
        }
      });
    $urlRouterProvider.otherwise('/login');
    $httpProvider.interceptors.push('AuthInterceptor');
  })

  .run(function (
    $ionicPlatform, App, AuthService, AuthEvents, StateHandler, Facebook) {
    isCordova = function (callback) {
      if (window.cordova) {
        document.addEventListener("deviceready", function () {
          callback();
        });
      } else {
        $ionicPlatform.ready(function () {
          callback();
        });
      }
    };
    isCordova(function () {
      StateHandler.$on();
      App.initMap('<your-map-key>');
      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
        cordova.plugins.Keyboard.disableScroll(true);
      }
      if (window.StatusBar) {
        StatusBar.backgroundColorByHexString("#128dd4");
        window.plugins.headerColor.tint('#3b53ba');
      }
      if (ionic.Platform.isWebView()) {
        screen.lockOrientation('portrait');
      }
      if (ionic.Platform.isAndroid() && ionic.Platform.isWebView()) {
        serviceUrl = 'file:///android_asset/www/';
      }
      Facebook.init({
        appId: '<app-facebook-app-id>'
      });
    });
  });
