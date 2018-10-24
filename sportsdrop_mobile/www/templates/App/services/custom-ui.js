angular.module('service.customUI', [])

  .service('CustomUI', function ($q, $timeout, $ionicModal, $ionicLoading, $ionicPopup, $ionicPopover,
    NotificationListener, EncryptDecrypt) {

    // get array item index by 'key' attribute
    Array.prototype.getIndexBy = function (name, value) {
      for (var i = 0; i < this.length; i++) {
        if (this[i][name] == value) {
          return i;
        }
      }
      return NODATA;
    };

    // remove name duplicates
    Array.prototype.unique = function (a) {
      return Array.from(new Set(a));
    };

    // create modal interface
    function modalView(templateUrl, scope) {
      $ionicModal.fromTemplateUrl(templateUrl, {
        scope: scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        scope.modal = modal;
        scope.modal.show();
      }).catch(function (err) {
        // handle error
      });
      scope.closeModal = function () {
        scope.modal.hide();
      };
      // cleanup the modal when we're done with it!
      scope.$on('$destroy', function () {
        scope.modal.remove();
      });
      // execute action on hide modal
      scope.$on('modal.hidden', function () {
        // execute action
        scope.modal.remove();
      });
      // execute action on remove modal
      scope.$on('modal.removed', function () {
        // execute action
      });
    }

    // create popup views
    function formView(url, scope, buttons, title) {
      if (title == undefined)
        title = '';
      if (buttons == undefined)
        buttons = [];
      return $ionicPopup.show({
        title: title,
        templateUrl: url,
        scope: scope,
        buttons: buttons
      });
    }

    // create popover views
    function popView(url, scope) {
      $ionicPopover.fromTemplateUrl(url, {
        scope: scope
      }).then(function (popover) {
        scope.popover = popover;
        scope.popover.show();
      });
      // close the popover
      scope.closeActions = function () {
        scope.popover.hide();
      };
      // execute action on hidden popover
      scope.$on('popover.hidden', function (event) {
        // execute action
        scope.popover.remove();
      });
      // execute action on remove popover
      scope.$on('popover.removed', function (event) {
        // execute action
      });
    }

    // custom DOM rendering
    function renderView(arr, options) {
      var length, avatar;
      if (!options) {
        options = {
          scope: undefined,
          game_ls: false,
          group_ls: false,
          chat_ls: false
        };
      }
      // check falsy-hood in required arguments
      if (!options.scope || !arr)
        return;
      else if (Object.prototype.toString.call(arr) !== '[object Array]')
        return;
      // clear the list before render
      var displayThis = [];
      if (options.game_ls && !options.group_ls && !options.chat_ls) {
        // games list view rendering
        var games = arr;
        length = games.length;
        // only render if there are games to display
        if (length > 0) {
          for (var i = 0; i < length; i++) {
            var idx = options.scope.tag_game_type.indexOf(games[i].game_activity.trim());
            // check whether game has been posted or belongs to different user
            games[i].tag_game_posted_icon = '';
            if (games[i].game_host !== options.scope.host) {
              games[i].tag_game_posted_icon = 'ion-forward';
            } else if (games[i].game_status_posted == false) {
              games[i].tag_game_posted_icon = 'ion-android-time';
            } else {
              games[i].tag_game_posted_icon = 'ion-android-done';
            }
            // check whether game has been deleted
            if (games[i].game_status_deleted) {
              if (ionic.Platform.isIOS())
                games[i].tag_game_posted_icon = 'ion-ios-trash-outline';
              else games[i].tag_game_posted_icon = 'ion-android-delete';
            }
            if (idx >= 0)
              games[i].tag_game_avatar = options.scope.tag_game_avatar[idx];
            // format the date and time field
            var dateTimeTag = new Date(games[i].game_date);
            games[i].tag_date = dateTimeTag.toDateString();
            games[i].tag_time = dateTimeTag.getHours() + ':' + dateTimeTag.getMinutes();
            // check invitation status of the game
            if (games[i].game_players.pending.indexOf(options.scope.host) > NODATA)
              games[i].tag_invite = 'pending';
            else if (games[i].game_players.accepted.indexOf(options.scope.host) > NODATA)
              games[i].tag_invite = 'accepted';
            else if (games[i].game_players.rejected.indexOf(options.scope.host) > NODATA)
              games[i].tag_invite = 'rejected';
            else
              games[i].tag_invite = '';
            displayThis.push(games[i]);
          }
          options.scope.gamesList = displayThis;
        }
      } else if (!options.game_ls && options.group_ls && !options.chat_ls) {
        // group list view rendering
        var groups = arr;
        length = groups.length;
        options.scope.groupList = groups;
        options.scope.groups = options.scope.groupList;
      } else if (!options.game_ls && !options.group_ls && options.chat_ls) {
        // group chat view rendering
        var msg = {};
        var chats = arr;
        chats.forEach(function (chatLine) {
          // decode message
          var msg = EncryptDecrypt.decrypt(chatLine);
          // map avatar to message sender
          var idx = options.scope.community.getIndexBy("name", msg.from);
          if (idx > NODATA)
            avatar = options.scope.community[idx].picture;
          else if (Config.Session.profile.fb) {
            // map avatar to facebook users
            avatar = Config.Session.profile.fb.picture.data.url;
          }
          // display message to DOM
          displayThis.push({
            avatar: avatar || blobUtil.createObjectURL(Config.Session._attachments['profile_pic.blob'].data),
            timestamp: msg.timestamp,
            from: msg.from,
            message: msg.message
          });
        });
        options.scope.messages = displayThis;
      }
      // display this list to current scope
      if (!options.scope.$$phase) {
        // $digest or $apply
        options.scope.$apply();
      }
    }

    // action sheet messages 
    function actionButton(title, scope) {
      // show action sheet if iOS
      // return $q(function (resolve, reject) {
      //   $ionicActionSheet.show({
      //     titleText: title,
      //     buttons: [{
      //       text: 'Yes'
      //     }],
      //     destructiveText: 'Cancel',
      //     buttonClicked: function (e) {
      //       resolve(true);
      //       return true;
      //     },
      //     destructiveButtonClicked: function (e) {
      //       if (scope)
      //         scope.popover.hide();
      //       reject(true);
      //       return true;
      //     }
      //   });
      // });
      return $ionicPopup.confirm({
        title: title,
        okText: 'Yes',
        okType: 'button-save',
        cancelText: 'Cancel',
        cancelType: 'button-cancel'
      });
    }

    // alert messages
    function alert(title, message) {
      if (message == undefined)
        message = '';
      return $ionicPopup.alert({
        title: title,
        template: message,
        okType: 'button-save'
      });
    }

    // show toaster messages
    function toaster(message, timeout) {
      $ionicLoading.show({
        template: '<p>' + message + '</p>',
        animation: 'fade-in'
      });
      $timeout(function () {
        $ionicLoading.hide();
      }, timeout);
    }

    // change theme
    function theme(theme) {
      var statusbar = '#128dd4',
        href = '';
      var link = document.head.getElementsByClassName('theme');
      if (theme == 'abyss' || theme == 'blossom' ||
        theme == 'dune' || theme == 'ember' || theme == 'winter')
        href = 'css/themes/' + theme + '.css';
      else {
        theme = 'default';
        href = 'css/themes/' + theme + '.css';
      }
      link[0].href = href;
      Config.Session.settings.theme = theme;
      if (window.StatusBar) {
        switch (theme) {
          case 'abyss':
            statusbar = '#303f9f';
            break;
          case 'blossom':
            statusbar = '#c2185b';
            break;
          case 'dune':
            statusbar = '#ffa000';
            break;
          case 'ember':
            statusbar = '#d32f2f';
            break;
          case 'winter':
            statusbar = '#607d8b';
            break;
          case 'default':
            statusbar = '#128dd4';
            break;
        }
        $timeout(function () {
          StatusBar.backgroundColorByHexString(statusbar);
          window.plugins.headerColor.tint(statusbar);
        }, 150);
      }
      return true;
    }

    // change message and group tones
    function tones(tone, options) {
      if (!options.tones) options.tones = 'message';
      switch (options.tones) {
        case 'message':
          Config.Session.settings.message_tones = tone.url;
          break;
        case 'group':
          Config.Session.settings.group_tones = tone.url;
          break;
        default:
          break;
      }
      NotificationListener.SetTones();
      return tone.name;
    }

    // change search radius
    function searchRadius(value) {
      // convert to metres
      var metres = value * 1000;
      Config.Session.settings.search.radius = metres;
      return true;
    }

    // show loading spinner
    function showSpinner(type, title) {
      if (title == undefined)
        title = '';
      switch (type) {
        case 'android':
          $ionicLoading.show({
            title: title,
            template: '<ion-spinner icon="android"></ion-spinner>',
            noBackdrop: true
          });
          break;
        case 'ios':
          $ionicLoading.show({
            title: title,
            template: '<ion-spinner icon="ios"></ion-spinner>',
            noBackdrop: true
          });
          break;
      }
    }

    // hide loading spinner
    function hideSpinner() {
      $timeout(function () {
        $ionicLoading.hide();
      }, 50);
    }

    return {
      actionButton: actionButton,
      alert: alert,
      formView: formView,
      modalView: modalView,
      popView: popView,
      renderView: renderView,
      toaster: toaster,
      theme: theme,
      tones: tones,
      searchRadius: searchRadius,
      showSpinner: showSpinner,
      hideSpinner: hideSpinner,
    };
  });
