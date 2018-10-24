angular.module('controller.home', [])

  .controller('HomeCtrl', function ($window, $state, $rootScope, $scope, AuthService, LocalHTTP, CustomUI,
    NotificationListener, Facebook) {

    // account information
    $scope.account = {
      name: LocalHTTP.userName(),
      email: Config.Session.profile.email,
      picture: Config.Session.profile.picture,
      community: Config.Session.profile.community
    };

    // set profile picture
    if (Config.Session._attachments) {
      var picture = Config.Session._attachments['profile_pic.blob'].data;
      var image = document.getElementById('profile-pic');
      $scope.account.picture = blobUtil.createObjectURL(picture);
      image.src = $scope.account.picture;
    } else {
      LocalHTTP.loadData(configDB, 'session').then(function (config) {
        Config.Session = config[0];
        if (config[0]._attachments) {
          var url = config[0]._attachments['profile_pic.blob'].data;
          $scope.account.picture = blobUtil.createObjectURL(url);
        } else
          $scope.account.picture = Config.Session.profile.picture;
        var image = document.getElementById('profile-pic');
        image.src = $scope.account.picture;
      }).catch(function (err) {
        // handle errors
      });
    }

    // fetch notifications list
    $scope.notificationList = NotificationListener.List();

    // clear the notifications list
    $scope.clearAll = function () {
      $scope.notificationList = NotificationListener.clearList();
    };

    // logout of the application
    $scope.logout = function () {
      var sessionStore = null;
      var confirmPopup = CustomUI.actionButton('Logout');
      // if yes, then logout of the application
      confirmPopup.then(function (res) {
        if (res) {
          CustomUI.showSpinner($rootScope.platformID);
          if (Config.Session.profile.fb)
            Facebook.logout();
          AuthService.logout(LocalHTTP.userName()).then(function () {
            $state.go('login');
            CustomUI.hideSpinner();
          }).catch(function (err) {
            CustomUI.alert('Logout Failed');
            CustomUI.hideSpinner();
          });
        }
        if ($scope.popover)
          $scope.popover.hide();
      });
    };

    // tutorials page
    $scope.tutorial = function () {
      // show the modal view
      CustomUI.modalView('templates/Settings/pages/about/help.html', $scope);
    };

    // load tutorial on first introduction
    if (!$window.localStorage.getItem("_tutorial")) {
      $scope.tutorial();
      $window.localStorage.setItem("_tutorial", true);
    }
  });
