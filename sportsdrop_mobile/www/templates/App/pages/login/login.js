angular.module('controller.login', [])

  .controller('LoginCtrl', function ($rootScope, $scope, $state, $ionicHistory, App, AuthService,
    LocalHTTP, CustomUI, Facebook, ionicMaterialInk) {

    // load image resources
    var stateURL = $state.current.name;
    $scope.logo = LocalHTTP.appLogo(stateURL);

    // existing user template
    $scope.user = {
      name: '',
      password: ''
    };

    // login existing user
    $scope.login = function () {
      var dataState = LocalHTTP.verifyUser($scope.user, true);
      if (dataState.state == false) {
        CustomUI.alert('Login Failed', dataState.msg);
        return false;
      }
      CustomUI.showSpinner($rootScope.platformID);
      AuthService.login($scope.user).then(function (res) {
        startUp();
      }, function (errMsg) {
        CustomUI.hideSpinner();
        CustomUI.alert('Login Failed', errMsg);
      });
    };

    // perform facebook login
    $scope.loginFB = function () {
      Facebook.login().then(function (fbUser) {
        CustomUI.showSpinner($rootScope.platformID);
        return AuthService.login(fbUser);
      }).then(function (res) {
        // handle success
        startUp();
      }).catch(function (err) {
        // handle error
        CustomUI.hideSpinner();
        CustomUI.alert('Login Failed');
      });
    };

    // proceed to home page
    function startUp() {
      $state.go('home');
      App.initConfig();
      $ionicHistory.nextViewOptions({
        disableAnimate: true,
        disableBack: true
      });
      CustomUI.hideSpinner();
    }

    ionicMaterialInk.displayEffect();
  });
