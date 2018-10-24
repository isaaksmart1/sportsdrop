angular.module('controller.register', [])

  .controller('RegisterCtrl', function ($rootScope, $cordovaInAppBrowser, $scope, $state,
    AuthService, APIEndpoint, CustomUI, LocalHTTP, ionicMaterialInk) {

    // load image resources
    var stateURL = $state.current.name;
    $scope.logo = LocalHTTP.appLogo(stateURL);

    // new user template
    $scope.user = {
      email: '',
      name: '',
      password: '',
      confirmpass: ''
    };

    // register new user
    $scope.signup = function () {
      var dataState = LocalHTTP.verifyUser($scope.user);
      if (dataState.state == false) {
        CustomUI.alert('Registration Failed', dataState.msg);
        return false;
      }
      CustomUI.showSpinner($rootScope.platformID);
      AuthService.register($scope.user).then(function (msg) {
        $state.go('login');
        CustomUI.alert(msg, '');
        CustomUI.hideSpinner();
      }, function (errMsg) {
        CustomUI.hideSpinner();
        CustomUI.alert('Registration Failed', errMsg);
      });
    };

    // call app privacy policy
    $scope.openPolicy = function () {
      var link = APIEndpoint.www + '/legal/';
      var options = {
        location: 'no',
        clearcache: 'no',
        toolbar: 'no'
      };
      $cordovaInAppBrowser.open(link, '_blank', options)
        .then(function (event) {
          // success
        })
        .catch(function (event) {
          // error
        });
    };

    ionicMaterialInk.displayEffect();
  });
