angular.module('controller.activity', ['ngTagsInput'])

  .controller('ActivityCtrl', function ($rootScope, $scope, $state, $anchorScroll, $timeout, Activity,
    PouchDBListener, LocalHTTP, GeoNav, CustomUI, ionicMaterialInk) {

    ///////////////////
    //  VARIABLES   //
    //////////////////

    var isPost = true;
    var appUser = LocalHTTP.userName();
    var searchGameTemplate;
    $scope.host = appUser;

    GeoNav.location($scope.map).then(function (res) {
      $scope.locationPlaceholder = 'Current Location';
    }).catch(function (err) {
      $scope.locationPlaceholder = 'Type a location...';
    });

    ///////////////////////
    //  MODEL RENDERING //
    //////////////////////

    LocalHTTP.loadGameIcons().then(function (result) {
      $scope.data.suggested = [];
      $scope.data.suggested = result.map(function (game) {
        return game;
      });
    });
    LocalHTTP.loadSearchTimes().then(function (times) {
      $scope.timeSelector = times;
    });

    // model the list of games
    $scope.gamesList = [];
    $scope.tag_game_type = [];
    $scope.tag_game_avatar = [];
    $scope.shouldShowAllGames = true;

    $scope.data = {};
    $scope.data.games = [];
    $scope.data.suggested = [];
    $scope.data.places = [];

    // control form elements scrolling
    $scope.scrollTo = function (id) {
      $anchorScroll(id);
    };

    // assign icons to game types
    $scope.fillGameType = function () {
      for (var i = 0; i < $scope.gameSelector.length; i++) {
        $scope.tag_game_type[i] = $scope.gameSelector[i].tag_game_type;
        $scope.tag_game_avatar[i] = $scope.gameSelector[i].tag_game_avatar;
      }
    };

    // auto search function
    $scope.search = function (input) {
      switch (input) {
        case 'games':
          $scope.data.places = [];
          if ($scope.newGame.game_activity.length < 3) {
            $scope.data.games = [];
            return;
          }
          if ($scope.data.games.length == 1) {
            if ($scope.newGame.game_activity.toLowerCase() == $scope.data.games[0].tag_game_type.toLowerCase()) {
              $scope.select($scope.data.games[0], 'games');
              return;
            }
          }
          LocalHTTP.searchGames($scope.newGame.game_activity).then(function (matches) {
            $scope.data.games = matches;
          });
          break;
        case 'places':
          $scope.data.games = [];
          if ($scope.newGame.game_address.length < 3) {
            $scope.data.places = [];
            return;
          }
          if ($scope.data.places.length == 1) {
            if ($scope.newGame.game_address.toLowerCase() == $scope.data.places[0].description.toLowerCase()) {
              $scope.select($scope.data.places[0], 'places');
              return;
            }
          }
          GeoNav.placesAutocomplete($scope.newGame.game_address).then(function (matches) {
            $scope.data.places = matches;
          });
          break;
      }
    };

    // select search term
    $scope.select = function (term, input) {
      switch (input) {
        case 'games':
          if ($scope.newGame.game_activity === "")
            $scope.newGame.game_activity = [];
          if ($scope.isPost) {
            $scope.newGame.game_activity = term.tag_game_type;
          } else {
            $scope.newGame.game_activity.push({
              text: term.tag_game_type
            });
          }
          $scope.data.games = [];
          break;
        case 'places':
          $scope.newGame.game_address = term.description;
          $scope.data.places = [];
          break;
      }
    };

    // display all the games to user
    $scope.updateGamesList = function () {
      $scope.shouldShowAllGames = true;
      // synchronise local database to UI
      LocalHTTP.loadGameIcons().then(function (icons) {
        $scope.gameSelector = icons;
        $scope.fillGameType();
        return true;
      }).then(function (success) {
        PouchDBListener.listen(activityDB, CustomUI.renderView, {
          scope: $scope,
          game_ls: success
        });
      });
    };

    // display list of host-only games
    $scope.userGames = function () {
      $scope.shouldShowAllGames = false;
      // clear list before filter
      var userGamesList = [];
      // check user has data to display
      var length = $scope.gamesList.length;
      if (length > 0) {
        for (i = 0; i < length; i++) {
          if ($scope.gamesList[i].game_host == appUser)
            userGamesList.push($scope.gamesList[i]);
        }
      }
      length = userGamesList.length;
      CustomUI.renderView(userGamesList, {
        scope: $scope,
        game_ls: true
      });
    };

    ///////////////////
    //  FUNCTIONS   //
    //////////////////

    // create a new or edit current game
    $scope.createOrEditGame = function (game) {
      // flag for posting games
      $scope.isPost = isPost = true;
      // create object to post or edit game data
      if (game != null) {
        // reset flags for close
        var rstType = game.game_activity;
        var rstAddr = game.game_address;
        var rstEdit = game.game_status_edited;
        var rstPost = game.game_status_posted;
        // set flags for save
        game.game_date = new Date(game.game_date);
        game.game_status_edited = true;
        game.game_status_posted = false;
        // prepopulate form fields
        $scope.newGame = game;
      } else
        $scope.newGame = Activity.createNewGame();
      // need to validate all form details
      $scope.gameCreateEditFormDetails = function () {
        return $scope.newGame;
      };
      // close the create game form
      $scope.closeModalView = function () {
        if (angular.isDefined(rstEdit)) {
          game.game_status_edited = rstEdit;
          game.game_status_posted = rstPost;
          game.game_activity = rstType;
          game.game_address = rstAddr;
        }
        $scope.modal.hide();
      };
      // create game from template
      CustomUI.modalView('templates/Activity/pages/actions/newgame.html', $scope);
    };

    // delete a game from database
    $scope.deleteGame = function (game) {
      var confirmPopup = CustomUI.actionButton('Delete Game ?');
      if (game != undefined) {
        confirmPopup.then(function (res) {
          if (res) {
            var idx = $scope.gamesList.indexOf(game);
            if (idx > NODATA) {
              Activity.deleteGame(game);
              // delete from display list
              $scope.gamesList.splice(idx, 1);
            }
          }
        });
      }
    };

    // update a game remotely
    $scope.editGame = function (game) {
      if (game != undefined) {
        var idx = $scope.gamesList.indexOf(game);
        if (idx >= 0) {
          $scope.createOrEditGame(game);
        }
      }
    };

    // open a game thread
    $scope.openGame = function (game) {
      $state.go('activities-details', {
        Params: {
          details: game,
          appUser: appUser
        }
      });
      return;
    };

    // search a game from remote database
    $scope.searchGame = function () {
      // flag for querying games
      $scope.isPost = isPost = false;
      if (searchGameTemplate)
        $scope.newGame = searchGameTemplate;
      else {
        // create object to query game data
        $scope.newGame = Activity.createNewGame();
        // change default text for search
        $scope.newGame.game_activity = '';
        // assign date-time word (today = default)
        $scope.newGame.game_date = 'Today';
        // hold the search value radius
        $scope.newGame.search_radius = 10;
      }
      // need to validate all form details
      $scope.gameQueryFormDetails = function () {
        searchGameTemplate = $scope.newGame;
        if ($scope.newGame.game_activity.length > 0) {
          var tags = '';
          $scope.newGame.game_activity.forEach(function (tag, k) {
            if (k === $scope.newGame.game_activity.length - 1)
              tags += tag.text;
            else
              tags += tag.text + ',';
          });
          $scope.newGame.game_activity = tags;
        } else $scope.newGame.game_activity = '';
        return $scope.newGame;
      };
      // close the query game form
      $scope.closeModalView = function () {
        $scope.modal.hide();
      };
      // query game form template
      CustomUI.modalView('templates/Activity/pages/actions/searchgame.html', $scope);
    };

    // search and save game buttons
    $scope.searchOrSaveGame = function (isPost) {
      if (isPost) {
        CustomUI.showSpinner($rootScope.platformID);
        var gamePost = $scope.gameCreateEditFormDetails();
        Activity.saveGame(gamePost, $state, $scope).then(function () {
          CustomUI.hideSpinner();
          // broadcast id on creating a new activity
          LiveSocket.emit('activity_id', gamePost._id);
          // close the view
          $scope.closeModalView();
        }).catch(function (err) {
          CustomUI.hideSpinner();
          $timeout(function () {
            CustomUI.alert(err, '');
          }, 500);
        });
      } else {
        $scope.closeModalView();
        CustomUI.showSpinner($rootScope.platformID);
        var gameQuery = $scope.gameQueryFormDetails();
        Activity.queryGame(gameQuery, $state, $scope).then(function () {
          CustomUI.hideSpinner();
        }).catch(function (err) {
          CustomUI.hideSpinner();
          $timeout(function () {
            CustomUI.alert(err, '');
          }, 500);
        });
      }
    };

    // send unposted games to database (offline handler)
    $scope.sendUnpostedGames = function () {
      // fetch all the games from the local database
      activityDB.allDocs({
        include_docs: true
      }).then(function (result) {
        var length = result.rows.length;
        var renderList = [];
        // filter the unposted games and re-post
        if (length > 0) {
          dbObject = result.rows;
          for (i = 0; i < length; i++) {
            renderList[i] = dbObject[i].doc;
            if (dbObject[i].doc.game_status_posted == false) {
              if (dbObject[i].doc.game_host == appUser)
                Activity.saveGame(dbObject[i].doc, $scope);
            }
          }
          CustomUI.showSpinner($rootScope.platformID);
          CustomUI.hideSpinner();
        }
      }).catch(function (err) {
        // handle any errors
      });
    };

    // prevent user from inputting expired dates
    $scope.$watch('newGame["game_date"]', function (newValue, oldValue, scope) {
      if (newValue != undefined) {
        var currentDate = new Date();
        if (newValue < currentDate) {
          scope.newGame.game_date = new Date(currentDate.getTime() + 1 * 60000);
        }
      }
    }, false);

    // watch games list for unposted activities
    $scope.$watch('gamesList', function (newValue, oldValue, scope) {
      if (oldValue.length > 0 || newValue.length > 0) {
        newValue.forEach(function (game) {
          if (!game.game_status_posted && game.game_host == appUser)
            $scope.pushGame = true;
          else
            $scope.pushGame = false;
        });
      }
    }, false);

    ionicMaterialInk.displayEffect();
  });
