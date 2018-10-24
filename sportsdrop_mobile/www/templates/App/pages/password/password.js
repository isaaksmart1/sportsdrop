angular.module('controller.resetpassword', [])

  .controller('ResetPassCtrl', function ($rootScope, $state, $scope, AuthService, CustomUI) {

    // existing user template

    $scope.user = {
      email: '',
      name: '',
      oldpassword: '',
      newpassword: '',
      confirmnewpass: ''
    };

    // reset user password
    $scope.resetPassword = function (user) {
      AuthService.resetPassword(user).then(function (msg) {
        $state.go('login');
        CustomUI.alert(msg, '');
        CustomUI.hideSpinner();
      }, function (errMsg) {
        CustomUI.hideSpinner();
        CustomUI.alert('Unable to reset password', errMsg);
      });
    };

  });
