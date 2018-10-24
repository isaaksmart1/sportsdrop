angular.module('controller.activity-info', [])

  .controller('ActDetailsCtrl', function ($scope, $state, $stateParams, $q, Activity, CustomUI, LocalHTTP, RemoteHTTP) {

    // apply game information to scope
    $scope.game = $stateParams.Params.details;
    var appUser = $stateParams.Params.appUser;
    var err = 'Activity Cancelled';

    // load approriate view style
    $scope.me = appUser;
    $scope.banner = LocalHTTP.loadGameBanner($scope.game.game_activity);
    $scope.host = ($scope.game.game_host == $scope.me) ? true: false;

    // format game address and date fields
    $scope.game.game_address = $scope.game.game_address.split(",")[0];
    $scope.game.game_date = new Date($scope.game.game_date);

    // apply formatted fields to scope
    $scope.game.tag_date = $scope.game.game_date.toDateString();
    $scope.game.tag_time = $scope.game.game_date.getHours() + ':' + $scope.game.game_date.getMinutes();

    // download game information for changes to details
    $scope.downloadInfo = function () {
      var community = null;
      var details = null;
      Activity.gameInfo($scope.game).then(function (information) {
        if (information.game_status_deleted)
          throw err;
        var profileList = [];
        var keys = Object.keys(information.game_players);
        for (var i = 0; i < keys.length; i++) {
          var players = information.game_players[keys[i]];
          for (var j = 0; j < players.length; j++) {
            if (players[j])
              profileList.push(players[j]);
            else {
              players.splice(j, 1);
              j = j - 1;
            }
          }
          information.game_players[keys[i]] = players;
        }
        details = information;
        return RemoteHTTP.callCommunity(appUser, profileList);
      }).then(function (list) {
        return LocalHTTP.fillPouch(list, communityDB, 'community');
      }).then(function (res) {
        return communityDB.allDocs({
          include_docs: true,
          attachments: true,
          binary: true
        });
      }).then(function (list) {
        // format the community list
        community = list.rows.map(function (member) {
          if (member.doc._attachments)
            member.doc.picture = blobUtil.createObjectURL(member.doc._attachments['profile_pic.blob'].data);
          else member.doc.picture = DEFAULT_PICTURE;
          return member.doc;
        });
        // assign pending list with thier profiles
        details.game_players.pending = Activity.playerProfiles(community,
          details.game_players.pending, 'pending', $scope);
        // assign accepted list with thier profiles
        details.game_players.accepted = Activity.playerProfiles(community,
          details.game_players.accepted, 'accepted', $scope);
        // assign rejected list with thier profiles
        details.game_players.rejected = Activity.playerProfiles(community,
          details.game_players.rejected, 'rejected', $scope);
        // assign retrieved data to scope
        $scope.game.game_activity = details.game_activity;
        $scope.game.game_address = details.game_address.split(",")[0];
        $scope.game.game_comments = details.game_comments;
        $scope.game.game_cost = details.game_cost;
        // split user lists into thier invitation groups
        $scope.joinList = details.game_players.pending.unique(details.game_players.pending);
        $scope.acceptList = details.game_players.accepted;
        $scope.rejectList = details.game_players.rejected;
        // broadcast id on opening an activity
        LiveSocket.emit('activity_id', $scope.game._id);
      }).catch(function (err) {
        CustomUI.alert(err, '').then(function () {
          $state.go('menu.activities');
        });
      });
    };

    // accept players
    $scope.accept = function (index) {
      $scope.acceptList.push($scope.joinList[index]);
      $scope.joinList.splice(index, 1);
      Activity.updateInvitations($scope);
    };

    // reject players
    $scope.reject = function (index) {
      $scope.rejectList.push($scope.joinList[index]);
      $scope.joinList.splice(index, 1);
      Activity.updateInvitations($scope);
    };

    // accept -> idle players
    $scope.accToPend = function (index) {
      $scope.joinList.push($scope.acceptList[index]);
      $scope.acceptList.splice(index, 1);
      Activity.updateInvitations($scope);
    };

    // reject -> idle players
    $scope.rejToPend = function (index) {
      $scope.joinList.push($scope.rejectList[index]);
      $scope.rejectList.splice(index, 1);
      Activity.updateInvitations($scope);
    };

    // game status styling (game view)
    $scope.gameStyle = function (game) {
      switch (game.tag_invite) {
        case 'request':
          return {
            'background-color': '#b126c2',
            'color': '#fff'
          };
        case 'pending':
          return {
            'background-color': '#ffce54'
          };
        case 'accepted':
          return {
            'background-color': '#26c281',
            'color': '#fff'
          };
        case 'rejected':
          return {
            'background-color': '#ff5b5b',
            'color': '#fff'
          };
        default:
          return {
            'background-color': '#fff'
          };
      }
    };

    // join a game
    $scope.joinGames = function (game) {
      CustomUI.actionButton('Join game ?').then(function (res) {
        if (res) {
          var idList = [],
            id = {};
          if ((game._id != undefined) && game.tag_invite === 'request') {
            id[game._id] = appUser;
            idList.push(id);
            RemoteHTTP.join(idList).then(function (res) {
              game.tag_invite = 'pending';
              $scope.gameStyle(game);
              return Activity.updateGameData(game);
            }).then(function () {
              game.game_player = LocalHTTP.userName();
              // broadcast id on joining an activity
              LiveSocket.emit('join_activity', game);
            }).catch(function (err) {
              // handle any errors
            });
          }
        } else {
          // do nothing
          game.tag_invite = '';
          $scope.gameStyle(game);
        }
      });
    };

    // choose a game to join
    $scope.joinSelect = function (game) {
      if (game != undefined) {
        if (game.tag_invite === '') {
          game.tag_invite = 'request';
          $scope.joinGames(game);
        } else if (game.tag_invite === 'pending' || game.tag_invite === 'accepted')
          $scope.toggleLeave(game);
        else
          game.tag_invite = '';
      }
    };

    // prompt user to leave/stay in game
    $scope.toggleLeave = function (game) {
      if (game.tag_invite != "") {
        CustomUI.actionButton('Leave game ?').then(function (res) {
          if (res)
            Activity.leaveGame(game);
          else
            game.checked = true;
        });
      }
    };
  });
