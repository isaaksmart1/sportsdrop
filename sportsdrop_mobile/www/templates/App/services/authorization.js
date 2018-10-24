angular.module('service.authorization', [])

  .service('AuthService', function ($q, $http, $window, APIEndpoint, EncryptDecrypt, LocalHTTP, Socket) {

    var isAuthenticated = false;
    var authToken;

    // load user token for server requests
    function loadUserCredentials() {
      var token = $window.localStorage.getItem(LOCAL_TOKEN_KEY);
      if (token)
        useCredentials(token);
      else destroyUserCredentials();
    }

    // save user token for server requests
    function storeUserCredentials(token) {
      $window.localStorage.setItem(LOCAL_TOKEN_KEY, token);
      useCredentials(token);
    }

    // attach user token for header requests
    function useCredentials(token) {
      isAuthenticated = true;
      authToken = token;
      // Set the token as header for your requests!
      $http.defaults.headers.common.Authorization = authToken;
    }

    // destroy user token when session expired
    function destroyUserCredentials() {
      authToken = undefined;
      isAuthenticated = false;
      $http.defaults.headers.common.Authorization = undefined;
      $window.localStorage.removeItem(LOCAL_TOKEN_KEY);
    }

    // check if user session has expired
    var checkSessionExpiration = function () {
      loadUserCredentials();
      $http.get(APIEndpoint.url + '/sportsdrop/sessiontimeout').then(function (result) {
        if (result.data.success);
      });
    };

    // clear the currently stored user session
    var clearSession = function () {
      $window.localStorage.removeItem(APP_USERNAME);
      destroyUserCredentials();
      Socket.disconnect();
      LocalHTTP.emptyPouch(activityDB, games_storage, 'websql');
      LocalHTTP.emptyPouch(groupsDB, groups_storage, 'websql');
      LocalHTTP.emptyPouch(communityDB, config_storage, 'websql');
      LocalHTTP.emptyPouch(configDB, config_storage, 'websql');
      Config.Session = Config.reset();
    };

    // register a new user
    var register = function (user) {
      return $q(function (resolve, reject) {
        $http.post(APIEndpoint.url + '/sportsdrop/signup', user).then(function (result) {
          if (result.data.success) {
            resolve(result.data.data);
          } else {
            reject(result.data.data);
          }
        });
      });
    };

    // login a user
    var login = function (user) {
      return $q(function (resolve, reject) {
        $http.post(APIEndpoint.url + '/sportsdrop/login', user).then(function (result) {
          if (result.data.success) {
            var activity = true,
              groups = true,
              config = true;
            if (result.data.session) {
              activity = LocalHTTP.fillPouch(result.data.session.games, activityDB, 'games');
              groups = LocalHTTP.fillPouch(result.data.session.groups, groupsDB, 'groups');
              if (!result.data.session.settings)
                result.data.session.settings = Config.Session.settings;
              config = LocalHTTP.fillPouch(result.data.session, configDB, 'session');
            } else {
              Config.Session.profile.name = result.config.data.name;
              config = LocalHTTP.fillPouch(Config.Session, configDB, 'session');
            }
            $q.all([activity, groups, config]).then(function (data) {
              $window.localStorage.setItem(APP_USERNAME, result.config.data.name);
              storeUserCredentials(result.data.token);
              resolve(result.data);
            });
          } else {
            reject(result.data.data);
          }
        });
      });
    };

    // logout a user
    var logout = function (user) {
      var session = {
        name: user,
        data: undefined
      };
      var activity = LocalHTTP.loadData(activityDB, 'tags');
      var groups = LocalHTTP.loadData(groupsDB, 'tags');
      var config = LocalHTTP.loadData(configDB, 'session');
      return $q(function (resolve, reject) {
        $q.all([activity, groups, config]).then(function (data) {
          Config.Session.games = data[0];
          Config.Session.groups = data[1];
          session.data = Config.Session;
          delete session.data._id;
          delete session.data._rev;
          if (session.data.profile.picture === DEFAULT_PICTURE)
            delete session.data.profile.picture;
          $http.post(APIEndpoint.url + '/sportsdrop/logout', session).then(function (result) {
            clearSession();
            resolve(result.data.success);
          }).catch(function (error) {
            reject(error);
          });
        });
      });
    };

    // reset user password
    var resetPassword = function (user) {
      return $q(function (resolve, reject) {
        $http.post(APIEndpoint.url + '/sportsdrop/forgotpassword', user).then(function (result) {
          if (result.data.success) {
            resolve(result.data.data);
          } else {
            reject('Try again');
          }
        });
      });
    };

    // delete a user account
    var deleteAccount = function (user) {
      return $q(function (resolve, reject) {
        $http.post(APIEndpoint.url + '/sportsdrop/deleteaccount', user).then(function (result) {
          if (result.data.status === true) {
            clearSession();
            resolve(result.data.status);
          } else throw false;
        }).catch(function (error) {
          // handle error
          reject(error);
        });
      });
    };

    loadUserCredentials();
    return {
      login: login,
      register: register,
      logout: logout,
      resetPassword: resetPassword,
      deleteAccount: deleteAccount,
      checkSessionExpiration: checkSessionExpiration,
      headerToken: loadUserCredentials,
      isAuthenticated: function () {
        return isAuthenticated;
      },
    };
  });
