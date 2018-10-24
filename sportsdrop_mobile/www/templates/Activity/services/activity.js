angular.module('service.activity', [])

  .service('Activity', function ($q, CustomUI, Community, LocalHTTP, GeoNav, RemoteHTTP) {

    var thisUser = LocalHTTP.userName();
    var gameModel = function (date, dateFmt) {
      return {
        // event data
        _id: date.toJSON(),
        game_title: '',
        game_activity: [],
        game_address: '',
        game_comments: '',
        game_cost: null,
        game_date: dateFmt,
        game_host: thisUser,
        game_lat: null,
        game_lng: null,
        game_players: {
          pending: [],
          accepted: [],
          rejected: [],
        },
        // status flags
        game_status_edited: false,
        game_status_posted: false,
        game_status_deleted: false,
      };
    };

    // create new games for posting and querying
    createNewGame = function () {
      // create object to query game data
      var dt = new Date();
      // format to account for DayLight Saving
      dt = new Date(dt.setHours(dt.getHours() - dt.getTimezoneOffset() / 60));
      // add 30 mins to current time (default)
      game_dt = new Date((dt.getTime() + 30 * 60000));
      var newGame = gameModel(dt, game_dt);
      return newGame;
    };

    // delete game activity
    deleteGame = function (game) {
      if (game.tag_invite == ('pending') || game.tag_invite == ('accepted')) {
        leaveGame(game);
      }
      // delete from local database
      activityDB.get(game._id).then(function (doc) {
        return activityDB.remove(doc);
      }).catch(function (err) {
        // handle any errors
      });
      // delete from remote database (host)
      if (thisUser == game.game_host) {
        RemoteHTTP.del(game).then(function (res) {
          // game deleted handle success
        }).catch(function (err) {
          // handle any errors
        });
      }
    };

    // retrieve game details remotely
    gameInfo = function (game) {
      return new $q(function (resolve, reject) {
        RemoteHTTP.info(game).then(function (res) {
          // remote scan complete, now update locally
          updateGameData(res).then(function (update) {
            // successfully updated
            return resolve(update);
          }).catch(function (err) {
            // handle any errors
            return reject(err);
          });
        }).catch(function (err) {
          // handle the game when it's been cancelled
          game.game_status_deleted = err;
          return resolve(game);
        });
      });
    };

    // leave game remotely
    leaveGame = function (game) {
      RemoteHTTP.leave(game).then(function (res) {
        game.tag_invite = "";
        game.tag_style = "button-light";
        return updateGameData(game);
      }).then(function () {
        game.game_player = LocalHTTP.userName();
        // broadcast id on leaving an activity
        LiveSocket.emit('leave_activity', game);
      }).catch(function (err) {
        // handle errors
      });
    };

    // query game remotely
    queryGame = function (game, state, scope) {
      // verify the game information before saving
      var gamestate = LocalHTTP.verifyData(game, false);
      if (gamestate.state == false) {
        CustomUI.toaster(gamestate.msg, 1000);
        return false;
      }
      // convert date-time words to UTC
      game.game_date = LocalHTTP.convertDate(game.game_date);
      if ((state.current.name == 'home') || !(MAP_INSTANCE))
        state.go('menu.map');
      // continue to querying the game
      return $q(function (resolve, reject) {
        RemoteHTTP.get(game).then(function (result) {
          var length = result.length;
          var promises = [];

          if (length > 0) {
            for (i = 0; i < length; i++) {
              GeoNav.gameMarker(MAP_INSTANCE, result[i], false);
              var promise = updateGameData(result[i]);
              promises.push(promise);
            }
          } else reject('No results Found');

          $q.all(promises).then(function (result) {
            resolve(true);
          }).catch(function (error) {
            activityDB.put(error[1]);
            resolve(true);
          });

        }).catch(function (err) {
          // handle any errors
          reject(err);
        });
      });
    };

    // save game locally and remotely
    saveGame = function (game, state, scope) {
      // format game details before save
      game.game_activity = game.game_activity.trim();
      game.game_address = game.game_address.trim();
      // verify the game information before saving
      var gamestate = LocalHTTP.verifyData(game, true);
      if (gamestate.state == false) {
        CustomUI.toaster(gamestate.msg, 1000);
        return false;
      }
      // move from home page to activities
      if ((state.current.name == 'home') || !(MAP_INSTANCE))
        state.go('menu.map');
      // continue to saving the game
      return $q(function (resolve, reject) {
        if (game.game_status_edited == true) {
          activityDB.get(game._id).then(function (doc) {
            doc = game;
            activityDB.put(doc);
          });
        } else activityDB.put(game);
        GeoNav.gameMarker(MAP_INSTANCE, game, true).then(function (results) {
          game.game_lat = results.gameLat;
          game.game_lng = results.gameLng;
          return RemoteHTTP.post(game);
        }).then(function (game) {
          updateGameData(game).then(function (res) {
            resolve(true);
          }).catch(function (res) {
            activityDB.put(res);
          });
        }).catch(function (err) {
          // handle any errors
          reject(err);
        });
      });
    };

    // detail player profiles
    playerProfiles = function (community, playerList, inviteTag, scope) {
      var appUser = LocalHTTP.userName();
      var length = playerList.length;
      var profileList = [];
      // assign list with thier profiles
      for (var i = 0; i < length; i++) {
        var player = playerList[i];
        // assign local profile for app user
        if (player === appUser) {
          scope.game.tag_invite = inviteTag;
          player = Config.Session.profile;
          if (Config.Session._attachments) {
            player._attachments = Config.Session._attachments;
            player.picture = blobUtil.createObjectURL(player._attachments['profile_pic.blob'].data);
          } else
            player.picture = Config.Session.profile.picture;
          profileList.push(player);
        } else {
          var idx = community.getIndexBy("name", player);
          if (idx > NODATA) {
            player = community[idx];
            // overwrite profile picture for facebook users
            if (player.fb)
              player.picture = player.fb.picture.data.url;
            profileList.push(player);
          }
        }
      }
      // return player profiles
      return profileList;
    };

    // update game data locally
    updateGameData = function (game) {
      return new $q(function (resolve, reject) {
        activityDB.get(game._id).then(function (doc) {
          return activityDB.remove(doc._id, doc._rev);
        }).then(function () {
          // handle update conflict
          game._rev = null;
          activityDB.put(game, game._rev);
          return resolve(game);
        }).catch(function (err) {
          // if game does not exist
          return reject([err, game]);
        });
      });
    };

    // update invites for the game remotely
    updateInvitations = function (scope) {
      var invitations = {
        _id: scope.game._id,
        accepted: [],
        rejected: []
      };
      // update player request fields
      scope.game.game_players.accepted = scope.acceptList.map(function (player) {
        return player.name;
      });
      scope.game.game_players.pending = scope.joinList.map(function (player) {
        return player.name;
      });
      scope.game.game_players.rejected = scope.rejectList.map(function (player) {
        return player.name;
      });
      RemoteHTTP.updateInvites(scope.game).then(function (res) {
        invitations.accepted = scope.game.game_players.accepted;
        invitations.rejected = scope.game.game_players.rejected;
        // add players to the community
        invitations.accepted.forEach(function (player) {
          Community.add(player);
        });
        // send invitation updates to clients
        LiveSocket.emit('activity_invitations', invitations);
      }).catch(function (err) {
        // handle errors
      });
    };

    return {
      createNewGame: createNewGame,
      deleteGame: deleteGame,
      gameInfo: gameInfo,
      leaveGame: leaveGame,
      queryGame: queryGame,
      saveGame: saveGame,
      playerProfiles: playerProfiles,
      updateGameData: updateGameData,
      updateInvitations: updateInvitations
    };
  });
