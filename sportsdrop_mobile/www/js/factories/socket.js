angular.module('factory.socketconnect', ['btford.socket-io'])

  .factory('Socket', function ($rootScope, socketFactory, Community, LocalHTTP, APIEndpoint, EncryptDecrypt) {

    var IoSocket = {};
    Socket = {};

    Socket.connect = function () {

      IoSocket = io.connect(APIEndpoint.url, {
        query: {
          name: LocalHTTP.userName()
        }
      });

      Socket = socketFactory({
        ioSocket: IoSocket
      });

      Socket.on('message_received', function (data) {
        groupsDB.get(data._id, {
          include_docs: true
        }).then(function (doc) {
          data.name = doc.name;
          doc.chats.push(data.message);
          return groupsDB.put(doc, doc._rev);
        }).then(function (res) {
          data.message = EncryptDecrypt.decrypt(data.message);
          data.title = data.name;
          data.text = data.message.from + ": " + data.message.message;
          $rootScope.$broadcast('socket:message_received', data);
        }).catch(function (err) {
          // handle errors
        });
      });

      Socket.on('group_invitation', function (data) {
        groupsDB.get(data._id).catch(function (err) {
          return groupsDB.put(data);
        }).then(function (res) {
          data.icon = null;
          data.title = data.name;
          data.text = data.admin + " has added you to the group";
          $rootScope.$broadcast('socket:group_invitation', data);
        }).catch(function (err) {
          // handle errors
        });
      });

      Socket.on('left_group', function (data) {
        groupsDB.get(data._id).then(function (group) {
          var idx = group.members.indexOf(data.user);
          group.members.splice(idx, 1);
          return groupsDB.put(group, group._rev);
        }).then(function (res) {
          data.icon = null;
          data.title = data.name;
          data.text = data.user + " has left the group";
          $rootScope.$broadcast('socket:left_group', data);
        }).catch(function (err) {
          // handle errors
        });
      });

      Socket.on('player_joined', function (data) {
        // add player to the community
        Community.add(data.game_player).then(function (player) {
          data.picture = player.picture;
          var date = new Date(data.game_date).toUTCString();
          data.title = data.game_activity + ": " + date;
          data.text = data.game_player + " has requested to play";
          $rootScope.$broadcast('socket:player_joined', data);
        }).catch(function (err) {
          // handle errors
        });
      });

      Socket.on('player_left', function (data) {
        var date = new Date(data.game_date).toUTCString();
        data.title = data.game_activity + ": " + date;
        data.text = data.game_player + " has left the activity";
        $rootScope.$broadcast('socket:player_left', data);
      });

      Socket.on('player_invited', function (data) {
        var appUser = LocalHTTP.userName();
        activityDB.get(data._id).then(function (game) {
          data.host = game.game_host;
          data.activity = game.game_activity;
          data.address = game.game_address;
          data.timestamp = new Date(game.game_date).toUTCString();
          var idx = game.game_players.pending.indexOf(appUser);
          if (idx > NODATA)
            game.game_players.pending.splice(idx, 1);
          idx = game.game_players.rejected.indexOf(appUser);
          if (idx > NODATA)
            game.game_players.rejected.splice(idx, 1);
          idx = game.game_players.accepted.indexOf(appUser);
          if (idx <= NODATA)
            game.game_players.accepted.push(appUser);
          return activityDB.put(game, game._rev);
        }).then(function () {
          // add host to the community
          return Community.add(data.host);
        }).then(function (host) {
          data.picture = host.picture;
          data.title = "You have been Invited by " + data.host;
          data.text = data.activity + ": " + data.address + ", " + data.timestamp;
          $rootScope.$broadcast('socket:player_invited', data);
        }).catch(function (err) {
          // handle errors
        });
      });

      Socket.on('player_rejected', function (data) {
        var appUser = LocalHTTP.userName();
        activityDB.get(data._id).then(function (game) {
          data.host = game.game_host;
          data.activity = game.game_activity;
          data.address = game.game_address;
          data.timestamp = new Date(game.game_date).toUTCString();
          var idx = game.game_players.pending.indexOf(appUser);
          if (idx > NODATA)
            game.game_players.pending.splice(idx, 1);
          idx = game.game_players.accepted.indexOf(appUser);
          if (idx > NODATA)
            game.game_players.accepted.splice(idx, 1);
          idx = game.game_players.rejected.indexOf(appUser);
          if (idx <= NODATA)
            game.game_players.rejected.push(appUser);
          return activityDB.put(game, game._rev);
        }).then(function () {
          data.title = "You have not been Invited";
          data.text = data.activity + ": " + data.address + ", " + data.timestamp;
          $rootScope.$broadcast('socket:player_rejected', data);
        }).catch(function (err) {
          // handle errors
        });
      });

      LiveSocket = Socket;
      return Socket;
    };

    Socket.disconnect = function () {
      if (IoSocket.connected) {
        LiveSocket = {};
        Socket.disconnect();
      }
    };

    return {
      connect: Socket.connect,
      disconnect: Socket.disconnect
    };
  });
