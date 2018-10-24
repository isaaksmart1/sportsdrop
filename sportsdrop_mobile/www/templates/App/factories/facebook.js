angular.module('factory.facebook', [])

  .factory('Facebook', function ($window, $q) {

    function init(params) {
      return $window.openFB.init(params);
    }

    function login() {
      var deferred = $q.defer();
      $window.openFB.login(function (result) {
        if (result.status === "connected") {
          deferred.resolve(statusConnectCallback({
            access_token: result.authResponse.accessToken,
            expires: result.authResponse.expiresIn,
            status: result.status
          }));
        } else
          deferred.reject(result);
      }, {
        scope: 'public_profile,email'
      });
      return deferred.promise;
    }

    function logout() {
      var deferred = $q.defer();
      $window.openFB.logout(function () {
        deferred.resolve();
      });
      return deferred.promise;
    }

    function revokePermissions() {
      var deferred = $q.defer();
      $window.openFB.revokePermissions(
        function () {
          deferred.resolve();
        },
        function () {
          deferred.reject();
        }
      );
      return deferred.promise;
    }

    function getLoginStatus() {
      var deferred = $q.defer();
      $window.openFB.getLoginStatus(
        function (result) {
          deferred.resolve(result);
        }
      );
      return deferred.promise;
    }

    function graphAPI(params) {
      if (!params.node) params.node = '';
      if (!params.edge) edge = '';
      if (!params.fields) fields = '';
      var deferred = $q.defer();
      var req = {
        path: (params.node ? '/' + params.node : '/me') +
          '/' + (params.edge ? params.edge : ''),
        params: extras(params)
      };
      req.success = function (result) {
        deferred.resolve(result);
      };
      req.error = function (error) {
        deferred.reject(error);
      };
      $window.openFB.api(req);
      //   var req = '';
      //   req += params.node ? params.node : '/me';
      //   req += params.edge ? ('/' + params.edge) : '';
      //   req += params.fields ? ('?fields=' + params.fields) : '';
      return deferred.promise;
    }

    function statusConnectCallback(status) {
      var keys = [];
      return graphAPI({
        edge: 'permissions'
      }).then(function (res) {
        return graphAPI({
          fields: 'id,name,about,age_range,birthday,email,picture'
        });
      }).then(function (profile) {
        keys = Object.keys(status);
        keys.forEach(function (key) {
          profile[key] = status[key];
        });
        return {
          fb: profile,
          name: profile.name
        };
      }).catch(function (err) {
        // handle errors
      });
    }

    function extras(obj) {
      var params = {},
        thisKey = null;
      keys = Object.keys(obj);
      keys.forEach(function (key) {
        thisKey = key;
        if (key === 'fields')
          params[thisKey] = obj[key];
      });
      return params;
    }

    function injectSDK() {
      var sdkScript = document.getElementById("fb-sdk");
      var fbRoot = document.getElementById("fb-root");
      if (sdkScript) {
        return true;
      }
      var script = document.createElement("script");
      script.type = "text/javascript";
      script.id = "fb-sdk";
      script.src = "lib/facebook-connect/fb-sdk.js";
      document.body.insertBefore(script, fbRoot);
    }

    injectSDK();

    return {
      init: init,
      login: login,
      logout: logout,
      revokePermissions: revokePermissions,
      graphAPI: graphAPI,
      getLoginStatus: getLoginStatus
    };
  });
