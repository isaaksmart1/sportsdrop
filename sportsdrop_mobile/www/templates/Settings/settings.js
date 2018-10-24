angular.module('controller.settings', ['service.camera'])

  .controller('OptCtrl', function ($window, $rootScope, $scope, $state, $stateParams, $timeout,
    $cordovaInAppBrowser, AuthService, APIEndpoint, LocalHTTP, RemoteHTTP, CustomUI, Camera,
    NotificationListener, Facebook, ionicMaterialInk) {

    // set notification tones
    $scope.msgTone = 'Default';
    $scope.grpTone = 'Default';
    $scope.fbAccount = Config.Session.profile.fb ? true : false;

    // account information
    $scope.account = {
      name: LocalHTTP.userName(),
      email: Config.Session.profile.email,
      picture: Config.Session.profile.picture,
      community: Config.Session.profile.community,
      // facebook account fields
      fb: fbProfile()
    };

    // account deletion page
    $scope.accountDel = function () {
      // confirm once more for user to delete account
      $scope.confirmAccountDeletion = function () {
        // if yes, then delete user account
        var confirmPopup = CustomUI.actionButton('Last chance, are you sure ?');
        confirmPopup.then(function (res) {
          if (res) {
            var thisUser = {
              name: LocalHTTP.userName(),
              email: Config.Session.profile.email
            };
            CustomUI.showSpinner($rootScope.platformID);
            AuthService.deleteAccount(thisUser).then(function (res) {
              $scope.closeModal();
              $state.go('login');
              CustomUI.hideSpinner();
            }).catch(function (err) {
              console.error('error deleting your account ' + err);
            });
          } else
            return true;
        });
      };
      // show the modal view
      CustomUI.modalView('templates/Settings/pages/account/delete.html', $scope);
    };

    // call app licenses
    $scope.licenses = function () {
      var link = APIEndpoint.www + '/licenses/';
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

    // customize app page
    $scope.customize = function () {
      // change search radius
      $scope.radius = {
        value: Config.Session.settings.search.radius / 1000
      };
      $scope.$watch('radius.value', function (newVal, oldVal) {
        $scope.radius.value = parseInt(newVal);
        CustomUI.searchRadius($scope.radius.value);
      });
      // change theme settings
      $scope.theme = function (theme) {
        var result = CustomUI.theme(theme);
        // store changes to config storage
        LocalHTTP.fillPouch(Config.Session, configDB, 'session');
      };
      // show the modal view
      CustomUI.modalView('templates/Settings/pages/account/customize.html', $scope);
    };

    // tutorials page
    $scope.tutorial = function () {
      // show the modal view
      CustomUI.modalView('templates/Settings/pages/about/help.html', $scope);
    };

    // profile page
    $scope.profile = function () {
      // gather profile information
      var params = $stateParams.info,
        profilePicture = null;
      // set profile picture
      var image = document.getElementById('profile-pic');
      if (params) {
        $scope.account = params;
        profilePicture = params._attachments['profile_pic.blob'].data;
        $scope.account.picture = blobUtil.createObjectURL(profilePicture);
        image.src = $scope.account.picture;
      } else {
        if (Config.Session._attachments) {
          profilePicture = Config.Session._attachments['profile_pic.blob'].data;
          $scope.account.picture = blobUtil.createObjectURL(profilePicture);
          image.src = $scope.account.picture;
        } else {
          LocalHTTP.loadData(configDB, 'session').then(function (config) {
            Config.Session = config[0];
            if (config[0]._attachments) {
              profilePicture = config[0]._attachments['profile_pic.blob'].data;
              $scope.account.picture = blobUtil.createObjectURL(profilePicture);
            }
            image.src = $scope.account.picture;
          }).catch(function (err) {
            // handle errors
          });
        }
      }
    };

    // use camera to take picture
    $scope.takePicture = function () {
      Camera.snapPhoto();
    };

    // open image gallery to choose picture
    $scope.imageGallery = function () {
      Camera.openGallery();
    };

    // submit feedback about the app
    $scope.contactUs = function () {
      $scope.feedback = {
        from: LocalHTTP.userName(),
        comments: ''
      };
      // buttons for the feedback template
      $scope.feedbackButtons = function (feedback) {
        return [{
          text: 'Cancel',
          type: 'button-cancel'
        }, {
          text: 'Submit',
          type: 'button-save',
          onTap: function (e) {
            var msg = '';
            if (feedback.comments) {
              RemoteHTTP.contactUs(feedback).then(function (msg) {
                CustomUI.alert('Thank you', msg);
              }).catch(function (msg) {
                CustomUI.alert('Status', msg);
              });
            } else {
              msg = 'Cannot leave comments empty';
              e.preventDefault();
              CustomUI.toaster(msg, 2000);
            }
          }
        }];
      };
      // create game from template
      var popupCtrl = CustomUI.formView('templates/Settings/pages/feedback.html',
        $scope, $scope.feedbackButtons($scope.feedback), 'Contact us');
    };

    // tone list page
    $scope.toneList = function (view) {

      // set view flags
      var title = '',
      idx;
      $scope.view = view;

      // populate with either message or group tones
      switch (view) {
        case 'message':
          title = 'Message Tones';
          $scope.prevTone = $scope.msgTone;
          LocalHTTP.toneNotifications('message').then(function (tones) {
            $scope.msgToneList = tones;
          });
          break;
        case 'group':
          title = 'Group Tones';
          $scope.prevTone = $scope.grpTone;
          LocalHTTP.toneNotifications('group').then(function (tones) {
            $scope.grpToneList = tones;
          });
          break;
      }

      // buttons for the tone list
      $scope.toneListBtns = function () {
        return [{
          text: 'Cancel',
          type: 'button-cancel',
          onTap: function (e) {
            switch ($scope.view) {
              case 'message':
                $scope.msgTone = $scope.prevTone;
                idx = $scope.msgToneList.getIndexBy("name", $scope.prevTone);
                CustomUI.tones($scope.msgToneList[idx], {
                  tones: 'message'
                });
                break;
              case 'group':
                $scope.grpTone = $scope.prevTone;
                idx = $scope.grpToneList.getIndexBy("name", $scope.prevTone);
                CustomUI.tones($scope.grpToneList[idx], {
                  tones: 'group'
                });
                break;
            }
            return true;
          }
        }, {
          text: 'Apply',
          type: 'button-save',
          onTap: function (e) {
            return true;
          }
        }];
      };

      // tone selector
      $scope.selTone = function (tone, type) {
        switch (type) {
          case 'message':
            $scope.msgTone = CustomUI.tones(tone, {
              tones: 'message'
            });
            break;
          case 'group':
            $scope.grpTone = CustomUI.tones(tone, {
              tones: 'group'
            });
            break;
        }
        NotificationListener.Demo(type);
      };

      // show the tones list view
      CustomUI.formView('templates/Settings/pages/notifications/tones.html', $scope,
        $scope.toneListBtns(), title);
    };

    // logout of the application
    $scope.logout = function () {
      var sessionStore = null;
      var confirmPopup = CustomUI.actionButton('Logout', $scope);
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

    // load facebook profile
    function fbProfile() {
      if ($scope.fbAccount) {
        return {
          status: Config.Session.profile.fb.status
          // about: Config.Session.profile.fb.about,
          // likes: Config.Session.profile.fb.likes
        };
      } else return undefined;
    }

    ionicMaterialInk.displayEffect();
  });
