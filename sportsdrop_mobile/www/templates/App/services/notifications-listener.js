angular.module('service.notificationlistener', [])

  .service('NotificationListener', function ($rootScope, $ionicPlatform, $cordovaMedia, PushService) {

    var msgTone = null,
      grpTone = null;
    var msgMedia = {
        fg: null,
        bg: null
      },
      grpMedia = {
        fg: null,
        bg: null
      };
    var msgSend = null;
    var list = [];

    // acquire platform specific resources
    getMediaUrl = function (media, foregroundFlag) {
      if (ionic.Platform.isAndroid()) {
        if (foregroundFlag)
          return "/android_asset/www/res/audio/" + media + ".mp3";
        else return "file://res/audio/" + media + ".mp3";
      } else return null;
    };

    // play demo sound
    Demo = function (tone) {
      if (ionic.Platform.isWebView()) {
        switch (tone) {
          case 'message':
            msgMedia.fg.play();
            break;
          case 'group':
            grpMedia.fg.play();
            break;
        }
      }
    };

    // initialize the notification listener
    Init = function () {
      $ionicPlatform.ready(function () {
        if (ionic.Platform.isWebView()) {
          SetTones();
          PushService.Init();
        }
      });
    };

    // apply sound tones
    SetTones = function () {
      msgTone = Config.Session.settings.message_tones;
      grpTone = Config.Session.settings.group_tones;
      msgMedia.fg = $cordovaMedia.newMedia(getMediaUrl(msgTone, true));
      grpMedia.fg = $cordovaMedia.newMedia(getMediaUrl(grpTone, true));
      msgMedia.bg = getMediaUrl('filling-your-inbox', false);
      grpMedia.bg = getMediaUrl('system', false);
    };

    // exclusive tone for sending messages
    MessageSendTone = function () {
      $ionicPlatform.ready(function () {
        if (ionic.Platform.isWebView())
          msgSend = $cordovaMedia.newMedia(getMediaUrl('all-eyes-on-me'));
      });
    };

    // collate notifications into a listener
    List = function () {
      return list;
    };

    clearList = function () {
      list = [];
      return list;
    };

    $rootScope.$on('socket:message_send', function () {
      if (msgSend)
        msgSend.play();
    });

    $rootScope.$on('socket:message_received', function (e, data) {
      if (msgMedia)
        PushService.Notify(data.title, data.text, msgMedia);
    });

    $rootScope.$on('socket:group_invitation', function (e, data) {
      if (grpMedia) {
        PushService.Notify(data.title, data.text, grpMedia);
        list.push(data);
      }
    });

    $rootScope.$on('socket:left_group', function (e, data) {
      if (grpMedia) {
        PushService.Notify(data.title, data.text, grpMedia);
        list.push(data);
      }
    });

    $rootScope.$on('socket:player_joined', function (e, data) {
      if (grpMedia) {
        PushService.Notify(data.title, data.text, grpMedia);
        list.push(data);
      }
    });

    $rootScope.$on('socket:player_left', function (e, data) {
      if (grpMedia) {
        PushService.Notify(data.title, data.text, grpMedia);
        list.push(data);
      }
    });

    $rootScope.$on('socket:player_invited', function (e, data) {
      if (grpMedia) {
        PushService.Notify(data.title, data.text, grpMedia);
        list.push(data);
      }
    });

    $rootScope.$on('socket:player_rejected', function (e, data) {
      if (grpMedia) {
        PushService.Notify(data.title, data.text, grpMedia);
        list.push(data);
      }
    });

    MessageSendTone();

    return {
      Init: Init,
      Demo: Demo,
      SetTones: SetTones,
      List: List,
      clearList: clearList,
    };
  });
