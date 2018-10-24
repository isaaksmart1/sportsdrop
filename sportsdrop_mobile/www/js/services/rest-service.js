angular.module('service.REST', [])

  .service('RemoteHTTP', function ($q, $http, $window, APIEndpoint) {

    // server request for saving remotely
    function post(game) {
      var msg = '';
      game = JSON.stringify(game, formatJSON);
      return $q(function (resolve, reject) {
        $http.post(APIEndpoint.url + '/sportsdrop/savegame', game)
          .success(function (response, status, headers, config) {
            if (response.status == DATAOK) {
              game = JSON.parse(response.data);
              game.game_status_posted = true;
              resolve(game);
            } else {
              // error handle if could not post data
              reject(response.status);
            }
          }).error(function (response, status, headers, config) {
            // error handle if could not establish server connection
            if (status == 0) {
              msg = 'Please check network connection';
              reject(msg);
            }
          });
      });
    }

    // server request for querying remotely
    function get(game) {
      var msg = '';
      game = JSON.stringify(game, formatJSON);
      return $q(function (resolve, reject) {
        $http.get(APIEndpoint.url + '/sportsdrop/findgame?' + game)
          .success(function (response, status, headers, config) {
            if (response.status == DATAOK) {
              // response.data = JSON.parse(response.data);
              resolve(response.data);
            } else if (response.status == NODATA) {
              // error handle if could not retrieve data
              msg = 'No Results Found';
              reject(msg);
            }
          }).error(function (response, status, headers, config) {
            // error handle if could not  establish server connection
            if (status == 0) {
              msg = 'Please check network connection';
              reject(msg);
            }
          });
      });
    }

    // server request for deleting remotely
    function del(game) {
      var msg = '';
      game = JSON.stringify(game, formatJSON);
      return $q(function (resolve, reject) {
        $http.get(APIEndpoint.url + '/sportsdrop/deletegame?' + game)
          .success(function (response, status, headers, config) {
            if (response.status == DATAOK) {
              resolve(response.status);
            } else {
              // error handle if could not delete data
              reject(response.status);
            }
          }).error(function (response, status, headers, config) {
            // error handle if could not establish server connection
            if (status == 0) {
              msg = 'Please check network connection';
              reject(msg);
            }
          });
      });
    }

    // server request for retrieving game details
    function info(game) {
      game = JSON.stringify(game, formatJSON);
      return $q(function (resolve, reject) {
        $http.get(APIEndpoint.url + '/sportsdrop/gameinfo?' + game)
          .success(function (response, status, headers, config) {
            response.data = JSON.parse(response.data);
            if (response.status == DATAOK) {
              resolve(response.data);
            } else if (response.status == NODATA) {
              reject(response.data);
            }
          }).error(function (response, status, headers, config) {
            // error handle if could not resolve server response
            reject(status);
          });
      });
    }

    // server request for querying remotely
    function join(game) {
      game = JSON.stringify(game, formatJSON);
      return $q(function (resolve, reject) {
        $http.get(APIEndpoint.url + '/sportsdrop/joingame?' + game)
          .success(function (response, status, headers, config) {
            if (response.status == DATAOK) {
              resolve(response.status);
            } else {
              // error handle if could not retrieve data
              reject(response.status);
            }
          }).error(function (response, status, headers, config) {
            // error handle if could not resolve server response
            reject(status);
          });
      });
    }

    // server request for calling community list
    function callCommunity(user, list) {
      var community = JSON.stringify({
        name: user,
        community: list
      }, formatJSON);
      return $q(function (resolve, reject) {
        $http.get(APIEndpoint.url + '/sportsdrop/community?' + community)
          .success(function (response, status, headers, config) {
            if (response.status == DATAOK)
              resolve(response.data);
          }).error(function (response, status, headers, config) {
            // error handle if could not resolve server response
            reject(status);
          });
      });
    }

    // server request for deleting remotely
    function leave(game) {
      game = JSON.stringify(game, formatJSON);
      return $q(function (resolve, reject) {
        $http.post(APIEndpoint.url + '/sportsdrop/leavegame', game)
          .success(function (response, status, headers, config) {
            if (response.status == DATAOK) {
              resolve(response.status);
            } else {
              // error handle if could not retrieve data
              reject(response.status);
            }
          }).error(function (response, status, headers, config) {
            // error handle if could not resolve server response
            reject(status);
          });
      });
    }

    // application feedback to server
    function contactUs(feed) {
      var msg = '';
      feed = JSON.stringify(feed);
      return $q(function (resolve, reject) {
        $http.post(APIEndpoint.url + '/sportsdrop/feedback', feed)
          .success(function (response, status, headers, config) {
            msg = response.data;
            resolve(msg);
          }).error(function (response, status, headers, config) {
            msg = 'Unable to send feedback. Please try again later.';
            reject(msg);
          });
      });
    }

    // server request for updating player requests
    function updateInvites(game) {
      game = JSON.stringify(game, formatJSON);
      return $q(function (resolve, reject) {
        $http.post(APIEndpoint.url + '/sportsdrop/updateinvites', game)
          .success(function (response, status, headers, config) {
            if (response.status == DATAOK) {
              resolve(response.status);
            } else {
              // error handle if could not retrieve data
              reject(response.status);
            }
          }).error(function (response, status, headers, config) {
            // error handle if could not resolve server response
            reject(status);
          });
      });
    }

    // create or modify user groups
    function createOrEdit(group) {
      return $q(function (resolve, reject) {
        $http.post(APIEndpoint.url + '/sportsdrop/groups', group)
          .success(function (response, status, headers, config) {
            return resolve(response);
          }).error(function (response, status, headers, config) {
            // error handle if could not resolve server response
            return reject(response);
          });
      });
    }

    // modify users profile information
    function setProfile(profile) {
      return $q(function (resolve, reject) {
        $http.post(APIEndpoint.url + '/sportsdrop/profile', profile)
          .success(function (response, status, headers, config) {
            if (response.status === true)
              return resolve(response);
          }).error(function (response, status, headers, config) {
            // error handle if could not resolve server response
            return reject(response);
          });
      });
    }

    // convert array fields to strings
    function formatJSON(name, val) {
      if (name === "pending")
        return val.toString();
      else if (name === "accepted")
        return val.toString();
      else if (name === "rejected")
        return val.toString();
      else if (name === "community")
        return val.toString();
      else return val;
    }

    return {
      get: get,
      post: post,
      del: del,
      info: info,
      join: join,
      leave: leave,
      callCommunity: callCommunity,
      contactUs: contactUs,
      createOrEdit: createOrEdit,
      setProfile: setProfile,
      updateInvites: updateInvites
    };
  });
