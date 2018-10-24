angular.module('service.pushservice', [])

  .service('PushService', function ($rootScope, $window, $cordovaLocalNotification) {

    // initialize local push service
    Init = function () {
      $cordovaLocalNotification.hasPermission(function (granted) {
        if (!granted) {
          $cordovaLocalNotification.registerPermission(function (granted) {
            if (!granted)
              return console.error('local notifications disabled');
            else return granted;
          });
        } else return granted;
      });
    };

    // emit notification event
    Notify = function (title, text, sound) {
      if (ionic.Platform.isWebView()) {
        if (APP_BACKGROUND) {
          $cordovaLocalNotification.schedule({
            id: 1,
            title: title,
            text: text,
            sound: sound.bg,
            at: new Date().getTime(),
            icon: 'res://icon_profile_pic',
            smallIcon: 'res://icon_notify',
          }).then(function (res) {
            // handle success
          }).catch(function (err) {
            // handle errors
          });
        } else sound.fg.play();
      }
    };

    // detect when the app is in the background
    document.addEventListener('pause', function () {
      APP_BACKGROUND = true;
    });

    // detect when the app is in the foreground
    document.addEventListener('resume', function () {
      APP_BACKGROUND = false;
    });

    return {
      Init: Init,
      Notify: Notify,
    };
  });
