angular.module('factory.appinit', [])

  .factory('App', function ($rootScope, $http, $q, Socket, CustomUI, GoogleMaps, LocalHTTP, NotificationListener) {

    // activate configuration file
    function AppConfig() {
      var apiKey = MAP_KEY;
      window.gmapLib = function () {
        GoogleMaps.gmapLib();
      };
      GoogleMaps.createMapScript(apiKey, 'gmapLib');
      Socket.connect();
      var activity = LocalHTTP.loadData(activityDB, 'tags');
      var groups = LocalHTTP.loadData(groupsDB, 'tags');
      var config = LocalHTTP.loadData(configDB, 'session');
      $q.all([activity, groups, config]).then(function (data) {
        Config.Session.games = data[0];
        Config.Session.groups = data[1];
        if (data[2][0]) {
          Config.Session.settings = overwrite(Config.Session.settings, data[2][0].settings);
          Config.Session.profile = overwrite(Config.Session.profile, data[2][0].profile);
        }
        CustomUI.theme(Config.Session.settings.theme);
        NotificationListener.Init();
      });
    }

    // append key information to object
    function overwrite(thisObj, newObj) {
      if (newObj) {
        var newObjKeys = Object.keys(newObj);
        for (var i = 0; i < newObjKeys.length; i++) {
          thisObj[newObjKeys[i]] = newObj[newObjKeys[i]];
        }
      }
      return thisObj;
    }

    // initialize map service
    function AppMap(key) {
      $http.get(serviceUrl + 'res/json/map-style.json').success(function (data) {
        MAP_STYLE = data;
      });
      if (typeof key != undefined)
        MAP_KEY = key;
      return MAP_KEY;
    }

    return {
      initConfig: AppConfig,
      initMap: AppMap
    };
  });
