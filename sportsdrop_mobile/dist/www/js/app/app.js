'strict'

// global constants
var DATAOK = 1;
var NODATA = -1;

// global status objects
var APP_BACKGROUND = false;
var APP_USERNAME = '_username';
var DEVICE_LOCATION = '_location';
var LOCAL_TOKEN_KEY = '_token';

// global map objects
var MAP_KEY = undefined;
var MAP_STYLE = undefined;
var MAP_INSTANCE = undefined;

// global resources
var DEFAULT_PICTURE = "img/social/default-profile-pic.png";

// global socket object
var LiveSocket = {};

// global service route
var serviceUrl = '';

// storage objects
var games_storage = 'games_activity_storage';
var groups_storage = 'groups_chats_storage';
var community_storage = 'community_storage';
var config_storage = 'config_file_storage';

// global configurations object
var Config = {
  Session: {
    games: [],
    groups: [],
    profile: {
      name: '',
      email: '',
      picture: DEFAULT_PICTURE,
      community: []
    },
    settings: {
      theme: 'default',
      enable_notifications: true,
      message_tones: 'all-eyes-on-me',
      group_tones: 'hurry',
      search: {
        favorites: [],
        radius: 5000
      }
    }
  },
  reset: function () {
    return {
      games: [],
      groups: [],
      profile: {
        name: '',
        email: '',
        picture: DEFAULT_PICTURE,
        community: []
      },
      settings: {
        theme: 'default',
        enable_notifications: true,
        message_tones: 'all-eyes-on-me',
        group_tones: 'hurry',
        search: {
          favorites: [],
          radius: 5000
        }
      }
    }
  }
};

// network configuration
var server = {
  dev: {
    addr: '127.0.0.1',
    port: '8060'
  },
  prod: {
    addr: 'www.sportsdrop.mobi',
    port: '80'
  },
  web: {
    addr: 'www.sportsdrop.co.uk',
    port: '80'
  },
  connect: function (mode, prot) {
    if (prot != 'http' && prot != 'https')
      return
    if (mode == 'dev')
      return prot + '://' + this.dev.addr + ':' + this.dev.port;
    else if (mode == 'prod' || mode == 'web')
      return prot + '://' + this[mode].addr + ':' + this[mode].port;
    else return
  },
}

angular.module('templates', []).run(['$templateCache', function($templateCache) {$templateCache.put('Activity/activities.html','<div ng-init="updateGamesList()">\r\n  <div class="sportsdrop bar bar-header has-tabs-top">\r\n    <div class="h1 title title-center color">My Activity</div>\r\n    <div class="buttons buttons-right header-item">\r\n      <span class="right-buttons">\r\n        <button ng-click="openActions()" class="button button-icon button-clear ng-class:{true: \'ion-android-more-horizontal\', false: \'ion-ios-more\'}[androidPlatform]"></button> \r\n      </span>\r\n    </div>\r\n    <div class="buttons buttons-left header-item">\r\n      <span class="right-buttons">\r\n        <button class="button button-icon button-clear ion-{{platformID}}-home" ui-sref="home"></button> \r\n        </span>\r\n    </div>\r\n  </div>\r\n  <ion-content class="has-tabs-top platform">\r\n    <ion-list can-swipe="true" swipe-direction="both">\r\n      <ion-item class="item item-avatar item-icon-right item-activity" type="item-text-wrap" ng-repeat="game in gamesList track by $index"\r\n        ng-click="openGame(game)">\r\n        <img ng-src="{{game.tag_game_avatar}}">\r\n        <h2>\r\n          <i class="{{game.tag_game_posted_icon}}"></i>\r\n          <!--<b>{{game.game_host === host ? \'Me\': game.game_host}}: </b>-->\r\n          <b>{{game.game_title}}: </b> {{game.tag_date}}, {{game.tag_time}}\r\n        </h2>\r\n        <p>{{game.game_address}}</p>\r\n        <i class="icon ion-chevron-right icon-accessory"></i>\r\n        <ion-option-button ng-show="host==game.game_host" side="right" class="button-light" ng-click="editGame(game)">\r\n          <i class="icon ion-compose"></i>\r\n        </ion-option-button>\r\n        <ion-option-button side="right" class="button-light" ng-click="deleteGame(game)">\r\n          <i class="icon ng-class:{true: \'ion-android-delete\', false: \'ion-ios-trash-outline\'}[androidPlatform]"></i>\r\n        </ion-option-button>\r\n        <div class="status {{game.tag_invite}}"></div>\r\n      </ion-item>\r\n    </ion-list>\r\n    <div ng-hide="gamesList.length > 0" class="empty-list">\r\n      <center><i class="icon ion-navicon-round"></i></center>\r\n      <center>You currently have no activities</center>\r\n    </div>\r\n  </ion-content>\r\n  <ion-footer-bar class="tabs tabs-icon-top sportsdrop bar-footer">\r\n    <a ng-click="searchGame()" class="tab-item" data-ink-color="{{inkColor()}}">\r\n      <i class="icon ion-{{platformID}}-search"></i><b>Search</b></a>\r\n    <a ng-show="!shouldShowAllGames" ng-click="updateGamesList()" class="tab-item" data-ink-color="{{inkColor()}}">\r\n      <i class="icon ng-class:{true: \'ion-social-buffer\', false: \'ion-social-buffer-outline\'}[androidPlatform]"></i><b>All Games</b></a>\r\n    <a ng-show="shouldShowAllGames" ng-click="userGames()" class="tab-item" data-ink-color="{{inkColor()}}">\r\n      <i class="icon ion-android-done"></i><b>My Games</b></a>\r\n    <a ng-click="createOrEditGame()" class="tab-item" data-ink-color="{{inkColor()}}">\r\n      <i class="icon ng-class:{true: \'ion-android-checkbox-outline\', false: \'ion-ios-compose-outline\'}[androidPlatform]"></i><b>New Game</b></a>\r\n    <a ng-show="pushGame" ng-click="sendUnpostedGames()" class="tab-item" data-ink-color="{{inkColor()}}">\r\n      <i class="icon ng-class:{true: \'ion-android-time\', false: \'ion-ios-clock-outline\'}[androidPlatform]"></i><b>Resend</b></a>\r\n  </ion-footer-bar>\r\n</div>\r\n');
$templateCache.put('Groups/groups.html','<div ng-init="updateGroupsList()">\r\n  <div class="sportsdrop bar bar-header has-tabs-top">\r\n    <div class="h1 title title-center color">My Groups</div>\r\n    <div class="buttons buttons-right header-item">\r\n      <span class="right-buttons">\r\n        <button ng-click="openActions()"\r\n        class="button button-icon button-clear ng-class:{true: \'ion-android-more-horizontal\', false: \'ion-ios-more\'}[androidPlatform]"> \r\n        </button> \r\n      </span>\r\n    </div>\r\n    <div class="buttons buttons-left header-item">\r\n      <span class="right-buttons">\r\n        <button class="button button-icon button-clear ion-{{platformID}}-home" ui-sref="home"></button> \r\n      </span>\r\n    </div>\r\n  </div>\r\n  <div class="has-tabs-top platform item-input-inset search-bar" style="z-index: 1;">\r\n    <label class="item-input-wrapper">\r\n      <i class="icon ion-{{platformID}}-search placeholder-icon"></i>\r\n      <input type="search" placeholder="Search" ng-change="groups = searchGroups(groupList)" ng-model="search.res">\r\n    </label>\r\n  </div>\r\n  <ion-content class="has-tabs-top platform" scroll="false">\r\n    <div ng-hide="groups.length > 0" class="empty-list">\r\n      <center><i class="icon ion-{{platformID}}-people"></i></center>\r\n      <center>No available groups</center>\r\n    </div>\r\n    <ion-scroll class="groups-container">\r\n      <div class="list">\r\n        <a class="item item-avatar item-activity" ng-repeat="group in groups">\r\n          <img src="img/icon-logos/icon-profile-pic.png" ng-click="openGroup(group)">\r\n          <h2 ng-click="openGroup(group)">{{group.name}}</h2>\r\n          <p ng-click="openGroup(group)">{{group.caption}}</p>\r\n          <p ng-click="openGroup(group)">{{group.size}} member(s)</p>\r\n          <div ng-click="deleteGroup(group)">\r\n            <label class="item-icon-right" style="padding-right: 0px;">\r\n            <i class="icon ng-class:{true: \'ion-android-delete\', false: \'ion-ios-trash-outline\'}[androidPlatform]"></i>\r\n          </label>\r\n          </div>\r\n        </a>\r\n      </div>\r\n    </ion-scroll>\r\n  </ion-content>\r\n</div>\r\n');
$templateCache.put('Map/map.html','<div ng-controller="ActivityCtrl">\r\n  <div class="sportsdrop bar bar-header has-tabs-top">\r\n    <div class="h1 title title-center color">Map</div>\r\n    <div class="buttons buttons-right header-item">\r\n      <span class="right-buttons"><button ng-click="openActions()"\r\n      class="button button-icon button-clear ng-class:{true: \'ion-android-more-horizontal\', false: \'ion-ios-more\'}[androidPlatform]"> \r\n            </button> \r\n        </span>\r\n    </div>\r\n    <div class="buttons buttons-left header-item">\r\n      <span class="right-buttons"><button class="button button-icon button-clear ion-{{platformID}}-home"\r\n      ui-sref="home"> \r\n            </button> \r\n        </span>\r\n    </div>\r\n  </div>\r\n  <ion-content class="has-tabs-top" scroll="false">\r\n    <map on-create="mapCreated(map)"></map>\r\n  </ion-content>\r\n  <ion-footer-bar class="tabs tabs-icon-top sportsdrop bar-footer">\r\n    <a ng-click="searchGame()" class="tab-item" data-ink-color="{{inkColor()}}" data-ink-opacity=".35">\r\n      <i class="icon ion-{{platformID}}-search"></i><b>Search</b></a>\r\n    <a ng-click="centerOnUser()" class="tab-item" data-ink-color="{{inkColor()}}" data-ink-opacity=".35">\r\n      <i class="icon ng-class:{true: \'ion-location\', false: \'ion-ios-location\'}[androidPlatform]"></i><b>My Location</b></a>\r\n    <a ng-click="createOrEditGame()" class="tab-item" data-ink-color="{{inkColor()}}" data-ink-opacity=".35">\r\n      <i class="icon ng-class:{true: \'ion-android-checkbox-outline\', false: \'ion-ios-compose-outline\'}[androidPlatform]"></i><b>New Game</b></a>\r\n  </ion-footer-bar>\r\n</div>\r\n');
$templateCache.put('Menu/menu.html','<div class="sportsdrop bar bar-header has-tabs-top">\r\n</div>\r\n<div class="tabs-striped tabs-top tabs-background-sportsdrop">\r\n  <div class="sportsdrop tabs">\r\n    <a class="tab-item" data-ink-opacity=".05" ui-sref=".map">\r\n      <i class="icon ion-map"></i>Map\r\n    </a>\r\n    <a class="tab-item" data-ink-opacity=".05" ui-sref=".activities">\r\n      <i class="icon ion-navicon-round"></i>My Activity\r\n    </a>\r\n    <a class="tab-item" data-ink-opacity=".05" ui-sref=".groups">\r\n      <i class="icon ion-{{platformID}}-people"></i>My Groups\r\n    </a>\r\n  </div>\r\n</div>\r\n<div ui-view></div>\r\n');
$templateCache.put('Settings/settings.html','<div>\r\n  <div class="sportsdrop bar bar-header has-tabs-top">\r\n    <div class="buttons buttons-left header-item">\r\n      <span class="right-buttons"><button class="button button-icon button-clear ion-{{platformID}}-home"\r\n      ui-sref="home"> \r\n            </button> \r\n        </span>\r\n    </div>\r\n    <div class="h1 title title-center color"> Settings</div>\r\n  </div>\r\n  <ion-content class="has-tabs-top platform">\r\n    <div class="list">\r\n      <a class="item item-icon-left settings" ui-sref="profile">\r\n        <i class="icon ion-{{platformID}}-person"></i> Profile\r\n      </a>\r\n      <a class="item item-icon-left settings" ui-sref="account">\r\n        <i class="icon ng-class:{true: \'ion-android-unlock\', false: \'ion-ios-unlocked-outline\'}[androidPlatform]"></i> Account\r\n      </a>\r\n      <a class="item item-icon-left settings" ui-sref="notifications">\r\n        <i class="icon ng-class:{true: \'ion-android-notifications\', false: \'ion-ios-bell-outline\'}[androidPlatform]"></i> Notifications\r\n      </a>\r\n      <a class="item item-icon-left settings" ui-sref="about">\r\n        <i class="icon ng-class:{true: \'ion-information-circled\', false: \'ion-ios-information\'}[androidPlatform]"></i> About\r\n      </a>\r\n      <a class="item item-icon-left settings" ng-click="logout()">\r\n        <i class="icon ion-android-exit"></i> Logout\r\n      </a>\r\n    </div>\r\n  </ion-content>\r\n</div>\r\n');
$templateCache.put('Menu/pages/pop-menu.html','<ion-popover-view ng-controller="OptCtrl" class="popover actions-list">\r\n  <ion-content scroll="false">\r\n    <div class="list">\r\n      <a ng-show="$state.includes(\'menu.groups\')" class="item" style="font-size:inherit" ui-sref="new-group">\r\n        New Group\r\n      </a>\r\n      <a class="item" style="font-size:inherit" ui-sref="community">\r\n        Community\r\n      </a>\r\n      <a class="item" style="font-size:inherit" ui-sref="menu.settings">\r\n        Settings\r\n      </a>\r\n      <a class="item" style="font-size:inherit" ng-click="logout()">\r\n        Logout\r\n      </a>\r\n    </div>\r\n  </ion-content>\r\n</ion-popover-view>\r\n');
$templateCache.put('Settings/pages/feedback.html','<div class="item item-input">\r\n  <textarea rows="10" placeholder="(max. 250 characters)" ng-model="feedback.comments" style="resize:none; padding-right: 16px"\r\n    maxlength="250"></textarea>\r\n</div>\r\n');
$templateCache.put('Activity/pages/actions/newgame.html','<ion-modal-view ng-controller="ActivityCtrl">\r\n  <div class="bar bar-header bar-dialog-header">\r\n    <div class="title title-center header-item">New Game</div>\r\n    <div class="buttons buttons-right header-item">\r\n      <span class="left-buttons">\r\n          <button class="button button-icon button-clear ng-class:{true: \'ion-close\', false: \'ion-ios-close-empty\'}[androidPlatform]" ng-click="closeModalView()"></button></span>\r\n    </div>\r\n  </div>\r\n  <div class="content has-header">\r\n    <div class="list">\r\n      <div class="item item-input">\r\n        <input type="text" placeholder="Title" ng-model="newGame.game_title">\r\n      </div>\r\n      <div class="item item-input">\r\n        <input type="search" placeholder="Which Sport ?" ng-change="search(\'games\')" ng-model="newGame.game_activity">\r\n      </div>\r\n      <div class="games" ng-show="data.games.length > 0">\r\n        <ul ng-click="select(game, \'games\')" ng-repeat="game in data.games">{{game.tag_game_type}}</ul>\r\n      </div>\r\n      <div class="item item-input">\r\n        <span class="input-label">Where ?</span>\r\n        <input id="placeSrch" type="search" placeholder="Enter a Location" ng-change="search(\'places\')" ng-focus="scrollTo(\'placeSrch\')"\r\n          ng-model="newGame.game_address">\r\n      </div>\r\n      <div class="places">\r\n        <ul ng-click="select(place, \'places\')" ng-repeat="place in data.places track by $index">{{place.description}}</ul>\r\n        <ul class="pac-logo" ng-show="data.places.length > 0"><img src="img/social/google-logo.png"></ul>\r\n      </div>\r\n      <div class="item item-input">\r\n        <span class="input-label">When ?</span>\r\n        <input type="date" ng-model="newGame.game_date"></input>\r\n      </div>\r\n      <div class="item item-input">\r\n        <span class="input-label">What time ?</span>\r\n        <input type="time" ng-model="newGame.game_date" formatted-time>\r\n      </div>\r\n      <div class="item item-input">\r\n        <textarea id="comments" rows="5" placeholder="Comments" ng-model="newGame.game_comments" style="resize:none; padding-right: 16px"\r\n          maxlength="100" ng-focus="scrollTo(\'comments\')"></textarea>\r\n      </div>\r\n    </div>\r\n  </div>\r\n  <div class="bar tabs tabs-icon-top sportsdrop bar-footer">\r\n    <a ng-click="searchOrSaveGame(true)" class="tab-item" data-ink-color="{{inkColor()}}">\r\n      <i class="icon ng-class:{true: \'ion-android-checkbox-outline\', false: \'ion-ios-compose-outline\'}[androidPlatform]"></i><b>Create</b></a>\r\n  </div>\r\n</ion-modal-view>\r\n');
$templateCache.put('Activity/pages/actions/searchgame.html','<ion-modal-view ng-controller="ActivityCtrl">\r\n  <div class="bar bar-header bar-dialog-header">\r\n    <div class="title title-center header-item">Search</div>\r\n    <div class="buttons buttons-right header-item">\r\n      <span class="left-buttons">\r\n          <button class="button button-icon button-clear ng-class:{true: \'ion-close\', false: \'ion-ios-close-empty\'}[androidPlatform]" ng-click="closeModalView()"></button></span>\r\n    </div>\r\n  </div>\r\n  <div class="content has-header">\r\n    <div class="list">\r\n      <tags-input ng-model="newGame.game_activity" placeholder="Any Sport" add-on-paste="true" add-on-space="true" add-on-enter="true">\r\n      </tags-input>\r\n      <div class="item item-input">\r\n        <span class="input-label">Starting point:</span>\r\n        <input id="placeSrch" type="text" placeholder="{{locationPlaceholder}}" ng-change="search(\'places\')" ng-focus="scrollTo(\'placeSrch\')"\r\n          ng-model="newGame.game_address">\r\n      </div>\r\n      <div class="range">\r\n        <i class="icon ion-{{platformID}}-search"></i>\r\n        <input type="range" name="volume" min="1" max="50" step="1" value="{{newGame.search_radius}}" ng-model="newGame.search_radius">\r\n        <i class="icon" style="font-size: 14px; font-weight: bold">{{newGame.search_radius}} km</i>\r\n      </div>\r\n      <div class="places">\r\n        <ul ng-click="select(place, \'places\')" ng-repeat="place in data.places track by $index">{{place.description}}</ul>\r\n        <ul class="pac-logo" ng-show="data.places.length > 0"><img src="img/social/google-logo.png"></ul>\r\n      </div>\r\n      <div class="item item-input item-select">\r\n        <span class="input-label">When ?</span>\r\n        <select style="width:100%; direction:ltr; max-width:100%" ng-model="newGame.game_date">\r\n            <option ng-hide="\'{{newGame.game_date}}\'" selected>{{newGame.game_date}}</option>\r\n            <option ng-repeat="within in timeSelector">{{within.time}}</option>\r\n        </select>\r\n      </div>\r\n      <div class="list card">\r\n        <div class="item item-divider">\r\n          Suggested Activities\r\n        </div>\r\n        <div class="games">\r\n          <button ng-click="select(game, \'games\')" ng-repeat="game in data.suggested">{{game.tag_game_type}}</button>\r\n        </div>\r\n      </div>\r\n    </div>\r\n  </div>\r\n  <div class="bar tabs tabs-icon-top sportsdrop bar-footer">\r\n    <a ng-click="searchOrSaveGame(false)" class="tab-item" data-ink-color="{{inkColor()}}">\r\n      <i class="icon ion-{{platformID}}-search"></i><b>Search</b></a>\r\n  </div>\r\n</ion-modal-view>\r\n');
$templateCache.put('Activity/pages/details/activity-info.html','<div ng-init="downloadInfo()" ng-model="game">\r\n  <div class="sportsdrop bar bar-header">\r\n    <div class="buttons buttons-left header-item">\r\n      <span class="left-buttons">\r\n        <button class="button button-icon button-clear ion-{{platformID}}-arrow-back" ui-sref="menu.activities"></button> \r\n      </span>\r\n    </div>\r\n    <h1 class="h1 title title-center color activity">{{game.game_host}}</h1>\r\n  </div>\r\n  <ion-content class="has-header activity-info">\r\n    <div class="card">\r\n      <section class="activity-container">\r\n        <div class="row header">\r\n          <img class="activity" ng-src="{{banner}}" alt="">\r\n          <div id="activity-tag">\r\n            <p>{{game.tag_date}}, {{game.tag_time}}\r\n            </p>\r\n          </div>\r\n        </div>\r\n        <div class="row list">\r\n          <div class="col">\r\n            <div id="activity-dividers date-time" class="item item-divider"></div>\r\n            <div ng-hide="host || (game.tag_invite == \'\')">\r\n              <div class="row">\r\n                <div class="col col-65">\r\n                  <button class="button button-activity" ng-style="gameStyle(game)">\r\n                  <span ng-switch on="game.tag_invite">\r\n                    <div ng-switch-when="request">Confirm Request</div>\r\n                    <div ng-switch-when="pending">Awaiting Response...</div>\r\n                    <div ng-switch-when="accepted">Invited</div>\r\n                    <div ng-switch-when="rejected">Rejected</div>\r\n                  </span>\r\n                </button>\r\n                </div>\r\n                <div class="col option">\r\n                  <button ng-show="game.tag_invite == \'request\'" class="button button-icon" ng-click="joinGames()">\r\n                    <i class="icon ion-happy-outline"></i> Join</button>\r\n                  <button ng-show="(game.tag_invite == \'pending\') || (game.tag_invite == \'accepted\')" class="button button-icon" ng-click="toggleLeave(game)">\r\n                    Leave</button>\r\n                </div>\r\n              </div>\r\n            </div>\r\n            <div id="activity-dividers" class="item item-divider">\r\n              Activity Details\r\n            </div>\r\n            <h3>{{game.game_activity}}</h3>\r\n            <h4>{{game.game_address}}</h4>\r\n            <div ng-show="game.game_comments" class="item item-text-wrap">\r\n              {{game.game_comments}}\r\n            </div>\r\n            <div id="activity-dividers" ng-show="host && joinList.length > 0" class="card requests">\r\n              Player Requests\r\n            </div>\r\n            <item ng-show="host" class="item item-avatar item-button-right" ng-repeat="player in joinList track by $index">\r\n              <img src="{{player.picture}}" ui-sref="profile({info: player})">\r\n              <span ui-sref="profile({info: player})">\r\n                <h2>{{player.name}}</h2>\r\n                <p>{{player.email}}</p>\r\n              </span>\r\n              <div class="buttons">\r\n                <button class="button button-icon" ng-click="accept($index)">\r\n                  <i class="icon ion-thumbsup balanced"></i>\r\n                </button>\r\n                <button class="button button-icon" ng-click="reject($index)">\r\n                  <i class="icon ion-thumbsdown assertive"></i>\r\n                </button>\r\n              </div>\r\n            </item>\r\n            <div id="activity-dividers" ng-show="host && acceptList.length > 0" class="card accepted">\r\n              Players Accepted\r\n            </div>\r\n            <div id="activity-dividers" ng-show="!host" class="item item-divider">\r\n              Players Attending ({{acceptList.length}})\r\n            </div>\r\n            <item ng-hide="!host && (game.tag_invite != \'accepted\')" class="item item-avatar item-button-right" ng-repeat="player in acceptList track by $index">\r\n              <img src="{{player.picture}}" ui-sref="profile({info: player})">\r\n              <span ui-sref="profile({info: player})">\r\n                <h2>{{player.name === me ? \'Me\': player.name}}</h2>\r\n                <p>{{player.email}}</p>\r\n              </span>\r\n              <div ng-show="host" class="button button-icon" ng-click="accToPend($index)">\r\n                <ion-spinner icon="ripple"></ion-spinner>\r\n              </div>\r\n            </item>\r\n            <div id="activity-dividers" ng-show="host && rejectList.length > 0" class="card rejected">\r\n              Players Rejected\r\n            </div>\r\n            <item ng-show="host" class="item item-avatar item-button-right" ng-repeat="player in rejectList track by $index">\r\n              <img src="{{player.picture}}" ui-sref="profile({info: player})">\r\n              <span ui-sref="profile({info: player})">\r\n                <h2>{{player.name}}</h2>\r\n                <p>{{player.email}}</p>\r\n              </span>\r\n              <div ng-show="host" class="button button-icon" ng-click="rejToPend($index)">\r\n                <ion-spinner icon="ripple"></ion-spinner>\r\n              </div>\r\n            </item>\r\n          </div>\r\n        </div>\r\n      </section>\r\n    </div>\r\n  </ion-content>\r\n  <ion-footer-bar ng-show="!host && (!game.game_status_deleted) && (game.tag_invite === \'\')" class="tabs tabs-icon-top sportsdrop bar-footer">\r\n    <a ng-click="joinSelect(game)" class="tab-item" data-ink-color="{{inkColor()}}">\r\n      <i class="icon ion-happy-outline"></i><b>Join</b></a>\r\n  </ion-footer-bar>\r\n</div>\r\n');
$templateCache.put('App/pages/home/home.html','<div>\r\n  <ion-content scroll="false" ng-controller="ActivityCtrl">\r\n    <section class="home-container">\r\n      <div class="row header">\r\n        <div class="col option-wheel">\r\n          <div class="row" ui-sref="menu.groups">\r\n            <div class="col text-center">\r\n              <div class="icon" ui-sref="menu.groups">\r\n                <i class="ion-{{platformID}}-people"></i></div>\r\n              <h3>Groups</h3>\r\n            </div>\r\n          </div>\r\n          <div class="row">\r\n            <div class="col text-center">\r\n              <div class="icon" ui-sref="menu.map">\r\n                <i class="ion-map"></i>\r\n              </div>\r\n              <h3>Map</h3>\r\n            </div>\r\n            <div class="col text-center">\r\n              <div class="icon" ng-click="searchGame()">\r\n                <i class="ion-{{platformID}}-search"></i></div>\r\n              <h3>Search</h3>\r\n            </div>\r\n          </div>\r\n          <div class="row">\r\n            <img id="profile-pic" src="{{account.picture}}" class="center" ui-sref="profile">\r\n          </div>\r\n          <div class="row">\r\n            <div class="col text-center">\r\n              <div class="icon" ui-sref="menu.activities">\r\n                <i class="ion-navicon-round"></i></div>\r\n              <h3>My Activity</h3>\r\n            </div>\r\n            <div class="col text-center">\r\n              <div class="icon" ng-click="createOrEditGame()">\r\n                <i ng-class="{true: \'ion-android-checkbox-outline\', false: \'ion-ios-compose-outline\'}[androidPlatform]"></i></div>\r\n              <h3>New Game</h3>\r\n            </div>\r\n          </div>\r\n          <div class="row">\r\n            <div class="col text-center">\r\n              <div class="icon" ng-click="logout()">\r\n                <i class="ion-android-exit"></i></div>\r\n              <h3>Logout</h3>\r\n            </div>\r\n          </div>\r\n        </div>\r\n      </div>\r\n      <div class="row">\r\n        <div class="col notification-list">\r\n          <div class="home bar">\r\n            <div class="h1 title title-left color">Notifications</div>\r\n            <div ng-show="notificationList.length > 0" class="buttons buttons-right header-item">\r\n              <span class="right-buttons">\r\n                <button ng-click="clearAll()" class="button button-icon button-clear ng-class:{true: \'ion-android-delete\', false: \'ion-ios-trash-outline\'}[androidPlatform]"> \r\n                </button> \r\n                </span>\r\n            </div>\r\n          </div>\r\n          <div class="content has-header" style="z-index:-1">\r\n            <div class="list" ng-model="notificationList">\r\n              <a ng-repeat="notification in notificationList" class="item item-avatar" style="transition-delay: 0.39s;">\r\n                <img src="{{notification.picture}}">\r\n                <h2>{{notification.title}}</h2>\r\n                <p>{{notification.text}}</p>\r\n              </a>\r\n              <a class="item item-avatar">\r\n                <span></span>\r\n                <h2></h2>\r\n                <p></p>\r\n              </a>\r\n              <div ng-hide="notificationList.length > 0" class="empty-list">\r\n                <center><i class="icon ng-class:{true: \'ion-android-notifications\', false: \'ion-ios-bell-outline\'}[androidPlatform]"></i></center>\r\n                <center>You have no new notifications</center>\r\n              </div>\r\n            </div>\r\n          </div>\r\n        </div>\r\n      </div>\r\n    </section>\r\n  </ion-content>\r\n</div>\r\n');
$templateCache.put('App/pages/login/login.html','<div>\r\n  <ion-content scroll="false">\r\n    <section class="login-container">\r\n      <div class="background cross-fade">\r\n        <img id="f7" src="img/login/bg-crt.jpg">\r\n        <img id="f6" src="img/login/bg-trck.jpg">\r\n        <img id="f5" src="img/login/bg-ten.jpg">\r\n        <img id="f4" src="img/login/bg-hoop.jpg">\r\n        <img id="f3" src="img/login/bg-ft.jpg">\r\n        <img id="f2" src="img/login/bg-str.jpg">\r\n      </div>\r\n      <div class="header text-center">\r\n        <img src="{{::logo}}" />\r\n      </div>\r\n      <div class="form">\r\n        <div class="list">\r\n          <div class="item item-input" style="padding-left: 0px">\r\n            <ion-md-input placeholder="Username" type="text" ng-model="user.name"></ion-md-input>\r\n          </div>\r\n          <div class="item item-input" style="padding-left: 0px">\r\n            <ion-md-input placeholder="Password" type="password" ng-model="user.password"></ion-md-input>\r\n          </div>\r\n        </div>\r\n        <div class="login-buttons">\r\n          <button class="button button-block button-login" ng-click="login()">Log In</button>\r\n          <button class="button button-block button-facebook" ng-click="loginFB()">\r\n            <img src="img/social/fb-logo.png" alt="" width="30" height="30" align="left">Continue with Facebook\r\n          </button>\r\n        </div>\r\n        <div class="row">\r\n          <button class="button button-clear" ui-sref="register">New user? Sign Up</button>\r\n          <button class="button button-clear" ui-sref="resetpass">Forgot password?</button>\r\n        </div>\r\n      </div>\r\n    </section>\r\n  </ion-content>\r\n</div>\r\n');
$templateCache.put('App/pages/password/password.html','<div>\r\n  <ion-content scroll="false">\r\n    <section class="register-container">\r\n      <div class="form">\r\n        <div class="list" style="margin-bottom: 5px">\r\n          <div class="item item-input-inset">\r\n            <label class="item-input-wrapper">\r\n              <input placeholder="Email" type="email" ng-model="user.email" required>\r\n            </label>\r\n          </div>\r\n          <div class="item item-input-inset">\r\n              <label class="item-input-wrapper">\r\n                <input placeholder="Display Name" type="text" ng-model="user.name" required>\r\n              </label>\r\n            </div>\r\n          <div class="item item-input-inset">\r\n            <label class="item-input-wrapper">\r\n              <input placeholder="Old Password" type="password" ng-model="user.oldpassword" required>\r\n            </label>\r\n          </div>\r\n          <div class="item item-input-inset">\r\n            <label class="item-input-wrapper">\r\n              <input placeholder="New Password" type="password" ng-model="user.newpassword" required>\r\n            </label>\r\n          </div>\r\n          <div class="item item-input-inset">\r\n            <label class="item-input-wrapper">\r\n              <input placeholder="Confirm New Password" type="password" ng-model="user.confirmnewpassword" required>\r\n            </label>\r\n          </div>\r\n        </div>\r\n      </div>\r\n      <div class="register-buttons">\r\n        <button class="button button-block button-register" ng-click="resetPassword(user)">Send</button>\r\n        <button class="button button-block button-cancel" ui-sref="login">Back to Log In</button>\r\n      </div>\r\n</div>\r\n</section>\r\n</ion-content>\r\n</div>\r\n');
$templateCache.put('App/pages/register/register.html','<div>\r\n  <ion-content scroll="false">\r\n    <section class="register-container">\r\n      <div class="form">\r\n        <div class="list" style="margin-bottom: 5px">\r\n          <div class="item item-input-inset">\r\n            <label class="item-input-wrapper">\r\n              <input placeholder="Email" type="email" ng-model="user.email" required>\r\n            </label>\r\n          </div>\r\n          <div class="item item-input-inset">\r\n            <label class="item-input-wrapper">\r\n              <input placeholder="Username" type="text" ng-model="user.name" required>\r\n            </label>\r\n          </div>\r\n          <div class="item item-input-inset">\r\n            <label class="item-input-wrapper">\r\n              <input placeholder="Password" type="password" ng-model="user.password" required>\r\n            </label>\r\n          </div>\r\n          <div class="item item-input-inset">\r\n            <label class="item-input-wrapper">\r\n              <input placeholder="Confirm Password" type="password" ng-model="user.confirmpass" required>\r\n            </label>\r\n          </div>\r\n          <!-- <label class="item item-input item-select">\r\n            <div class="input-label">Choose Language</div>\r\n            <select>\r\n              <option>Deutsch</option>\r\n              <option selected>English</option>\r\n              <option>Espa\xF1ol</option>\r\n              <option>Fran\xE7ais</option>\r\n              <option>Portugu\xEAs</option>\r\n              <option>\u666E\u901A\u8BDD</option>\r\n              </select>\r\n          </label> -->\r\n        </div>\r\n        <div class="register-buttons">\r\n          <button class="button button-block button-register" ng-click="signup()">Register</button>\r\n          <button class="button button-block button-cancel" ui-sref="login">Back to Log In</button>\r\n          <div class="terms">Creating an account means you agree to our\r\n            <a href="#" ng-click="openPolicy()">Terms and Privacy Policy</a>\r\n          </div>\r\n        </div>\r\n      </div>\r\n    </section>\r\n  </ion-content>\r\n</div>\r\n');
$templateCache.put('Groups/pages/chat/chat.html','<ion-modal-view ng-controller="ChatCtrl" ng-model="groupInfo" ng-init="scrollContentToBottom()">\r\n  <ion-header-bar class="bar bar-header bar-theme" ng-click="closeModal()">\r\n    <div class="buttons buttons-left header-item">\r\n      <span class="left-buttons">\r\n      <button class="button button-icon button-clear ion-{{platformID}}-arrow-back"></button> \r\n      </span>\r\n    </div>\r\n    <h1 class="title title-left">\r\n      {{groupInfo.name}}\r\n      <span ng-repeat="members in groupInfo.members" style="font-size: 14px; font-style: italic;">\r\n      {{members}}, \r\n    </span>\r\n    </h1>\r\n  </ion-header-bar>\r\n  <ion-content scroll="false">\r\n    <ion-scroll class="message-container" delegate-handle="chat-window">\r\n      <ion-list>\r\n        <div ng-class="message.from !== user ? \'message\' : \'message right\'" ng-repeat="message in messages">\r\n          <img src="{{message.avatar}}">\r\n          <div class="bubble">\r\n            {{message.message}}\r\n            <div class="corner"></div>\r\n            <span ng-show="message.from !== user" class="from">{{message.from}}</span>\r\n            <span>{{message.timestamp}}</span>\r\n          </div>\r\n        </div>\r\n      </ion-list>\r\n    </ion-scroll>\r\n  </ion-content>\r\n  <div class="bottom-message-input">\r\n    <ion-input class="item-input item-input-wrapper">\r\n      <span ng-show="typing" class="input-label typist">{{typist}} is typing...</span>\r\n      <input type="text" placeholder="Type your message" ng-change="sendTyping(user)" ng-model="messageBox.text" ng-focus="focus=true"\r\n        ng-blur="focus=false">\r\n      <ion-label class="icon ng-class:{true: \'ion-android-send\', false: \'ion-ios-paperplane\'}[androidPlatform]" ng-click="sendMessage()" ng-if="focus && messageBox.text.length">\r\n      </ion-label>\r\n    </ion-input>\r\n  </div>\r\n</ion-modal-view>\r\n');
$templateCache.put('Groups/pages/community/community.html','<div ng-controller="GroupCtrl" ng-init="community()">\r\n  <ion-header-bar class="bar bar-header bar-theme" ui-sref="menu.groups">\r\n    <div class="buttons buttons-left header-item">\r\n      <span class="left-buttons">\r\n      <button class="button button-icon button-clear ion-{{platformID}}-arrow-back"></button> \r\n      </span>\r\n    </div>\r\n    <h1 class="title">Community</a>\r\n    </h1>\r\n  </ion-header-bar>\r\n  <div class="has-header item-input-inset search-bar" style="z-index:0;">\r\n    <label class="item-input-wrapper">\r\n      <i class="icon ion-{{platformID}}-search placeholder-icon"></i>\r\n      <input type="search" placeholder="" ng-change="persons = searchGroups(communityList)" ng-model="search.res">\r\n    </label>\r\n  </div>\r\n  <ion-content class="has-tabs-top platform" scroll="false">\r\n    <ion-scroll class="community-container">\r\n      <div class="list">\r\n        <div ng-repeat="person in persons">\r\n          <div class="item item-avatar item-button-right" ng-class="person.blocked ? \'blocked\' : \'null\'">\r\n            <img src="{{person.picture}}" ui-sref="profile({info: person})">\r\n            <span ui-sref="profile({info: person})">\r\n              <h2>{{person.name}}</h2>\r\n              <p>{{person.email}}</p>\r\n            </span>\r\n            <div ng-hide="person.blocked" class="button person" ng-click="blockPerson(person)">\r\n              <span>block</span>\r\n            </div>\r\n            <div ng-show="person.blocked" class="button person" ng-click="unBlockPerson(person)">\r\n              <span>unblock</span>\r\n            </div>\r\n          </div>\r\n        </div>\r\n      </div>\r\n    </ion-scroll>\r\n  </ion-content>\r\n</div>\r\n');
$templateCache.put('Groups/pages/new-group/confirm-group.html','<ion-modal-view>\r\n  <ion-header-bar class="bar bar-header bar-theme" ng-click="closeModal()">\r\n    <div class="buttons buttons-left header-item">\r\n      <span class="left-buttons">\r\n      <button class="button button-icon button-clear ion-{{platformID}}-arrow-back"></button> \r\n      </span>\r\n    </div>\r\n    <h1 class="title">New Group</a>\r\n    </h1>\r\n  </ion-header-bar>\r\n  <button class="button button-fab button-fab-top-left button-theme icon ion-android-done" style="top: 65px; left: 80%;"\r\n    ng-click="clickOK()"></button>\r\n  <ion-content class="has-tabs-top platform" scroll="false">\r\n    <div class="list">\r\n      <label class="item item-input item-stacked-label">\r\n            <span class="input-label">Group Name</span>\r\n            <input type="text" placeholder="Type your name" ng-model="group.name">\r\n        </label>\r\n      <label class="item item-input item-stacked-label">\r\n            <span class="input-label">Nickname</span>\r\n            <input type="text" placeholder="Type your caption" ng-model="group.caption">\r\n        </label>\r\n    </div>\r\n  </ion-content>\r\n  </ion-modal-view>\r\n');
$templateCache.put('Groups/pages/new-group/new-group.html','<div ng-controller="GroupCtrl" ng-init="newGroup()">\r\n  <ion-header-bar class="bar bar-header bar-theme" ui-sref="menu.groups">\r\n    <div class="buttons buttons-left header-item">\r\n      <span class="left-buttons">\r\n      <button class="button button-icon button-clear ion-{{platformID}}-arrow-back"></button> \r\n      </span>\r\n    </div>\r\n    <h1 class="title">New Group</a>\r\n    </h1>\r\n  </ion-header-bar>\r\n  <button class="button button-fab button-fab-top-left button-theme icon ion-{{platformID}}-arrow-forward" style="top: 65px; left: 80%;"\r\n    ng-click="goConfirm()"></button>\r\n  <div class="has-header item-input-inset search-bar" style="z-index:0;">\r\n    <label class="item-input-wrapper">\r\n      <i class="icon ion-{{platformID}}-search placeholder-icon"></i>\r\n      <input type="search" placeholder="Search people to add" ng-change="persons = searchGroups(communityList)" ng-model="search.res">\r\n    </label>\r\n  </div>\r\n  <ion-content class="has-tabs-top platform" scroll="false">\r\n    <ion-scroll ng-show="memberList.length > 0" direction="x" class="members-container">\r\n      <div class="row">\r\n        <div class="box text-center" ng-repeat="member in memberList" ng-click="removeMember(member)">\r\n          <div class="item item-avatar">\r\n            <img src="{{member.picture}}">\r\n          </div>\r\n        </div>\r\n      </div>\r\n    </ion-scroll>\r\n    <ion-scroll class="community-container">\r\n      <div class="list">\r\n        <div ng-repeat="person in persons" ng-click="addMember(person)">\r\n          <div class="item item-avatar item-button-right">\r\n            <img src="{{person.picture}}">\r\n            <span>\r\n              <h2>{{person.name}}</h2>\r\n              <p>{{person.email}}</p>\r\n            </span>\r\n          </div>\r\n        </div>\r\n      </div>\r\n    </ion-scroll>\r\n  </ion-content>\r\n</div>\r\n');
$templateCache.put('Settings/pages/about/about.html','<div ng-controller="OptCtrl">\r\n  <ion-header-bar class="bar bar-header bar-theme" ui-sref="menu.settings">\r\n    <div class="buttons buttons-left header-item">\r\n      <span class="left-buttons">\r\n      <button class="button button-icon button-clear ion-{{platformID}}-arrow-back"></button> \r\n      </span>\r\n    </div>\r\n    <h1 class="title">About</h1>\r\n  </ion-header-bar>\r\n  <ion-content>\r\n    <div class="list">\r\n      <a class="item item-icon-left settings" ng-click="tutorial()">\r\n        <i class="icon ion-help"></i> Tutorial\r\n      </a>\r\n      <a class="item settings" ng-click="openPolicy()">\r\n        Privacy Policy\r\n      </a>\r\n      <a class="item settings" ng-click="licenses()">\r\n        Licenses and Attributions\r\n      </a>\r\n      <label class="item item-stacked-label settings" ng-click="contactUs()">\r\n        <span>Need Help ?</span>\r\n        <p type="text">Contact us for assistance</p>\r\n      </label>\r\n    </div>\r\n  </ion-content>\r\n</div>\r\n');
$templateCache.put('Settings/pages/about/help.html','<ion-modal-view>\r\n  <ion-header-bar class="bar bar-header bar-theme" ng-click="closeModal()">\r\n    <div class="buttons buttons-left header-item">\r\n      <span class="left-buttons">\r\n      <button class="button button-icon button-clear ion-{{platformID}}-arrow-back"></button> \r\n      </span>\r\n    </div>\r\n    <h1 class="title">Tutorial</h1>\r\n  </ion-header-bar>\r\n  <ion-content>\r\n    <ion-slide-box class="help" does-continue="true" auto-play="true" slide-interval="5000">\r\n      <ion-slide>\r\n        <h3>Create your first activity by tapping <b>Post</b></h3>\r\n        <img src="img/help-slides/slide1.jpg" />\r\n      </ion-slide>\r\n      <ion-slide>\r\n        <h3>View a list of your activities which you can Edit and Delete. Just tap the right icon to edit and <b>Tap and Hold </b>\r\n        an item to delete</h3>\r\n        <img src="img/help-slides/slide2.jpg" />\r\n      </ion-slide>\r\n      <ion-slide>\r\n        <h3>Find other people\'s activities over the internet by tapping <b>Search</b></h3>\r\n        <img src="img/help-slides/slide3.jpg" />\r\n      </ion-slide>\r\n      <ion-slide>\r\n        <h3>You can send a request to join by tapping the toggle. You should notice a <b>Smiley Face</b> icon appear at the bottom\r\n          of the screen</h3>\r\n        <img src="img/help-slides/slide4.jpg" />\r\n      </ion-slide>\r\n      <ion-slide>\r\n        <h3>Tapping the <b>Smiley Face</b> allows you to join the activity</h3>\r\n        <img src="img/help-slides/slide5.jpg" />\r\n      </ion-slide>\r\n      <ion-slide>\r\n        <h3>Any activities you have pending will toggle as\r\n          <font color="orange">Orange</font>\r\n          indicating that your request is waiting for a response</h3>\r\n        <img src="img/help-slides/slide6.jpg" />\r\n      </ion-slide>\r\n      <ion-slide>\r\n        <h3>View the locations of your games using the <b>Map</b></h3>\r\n        <img src="img/help-slides/slide7.jpg" />\r\n      </ion-slide>\r\n      <ion-slide>\r\n        <h3>Please do not forget to send us feedback about your experiences using the App. Thank you</h3>\r\n        <img src="img/help-slides/slide8.jpg" />\r\n      </ion-slide>\r\n    </ion-slide-box>\r\n  </ion-content>\r\n</ion-modal-view>\r\n\r\n');
$templateCache.put('Settings/pages/account/account.html','<div ng-controller="OptCtrl">\r\n  <ion-header-bar class="bar bar-header bar-theme" ui-sref="menu.settings">\r\n    <div class="buttons buttons-left header-item">\r\n      <span class="left-buttons">\r\n      <button class="button button-icon button-clear ion-{{platformID}}-arrow-back"></button> \r\n      </span>\r\n    </div>\r\n    <h1 class="title">Account</h1>\r\n  </ion-header-bar>\r\n  <ion-content>\r\n    <div class="list">\r\n      <label class="item item-icon-left item-input item-stacked-label settings">\r\n            <span class="input-label">Email</span>\r\n            <p type="text">{{account.email}}</p>\r\n          </label>\r\n      <label class="item item-icon-left item-input item-stacked-label settings">\r\n            <span class="input-label">Display Name</span>\r\n            <p type="text">{{account.name}}</p>\r\n          </label>\r\n      <a class="item item-icon-left settings" ng-click="customize()">\r\n        <i class="icon ng-class:{true: \'ion-android-options\', false: \'ion-ios-settings\'}[androidPlatform]"></i> Customize\r\n      </a>\r\n      <a class="item item-icon-left settings" ng-click="accountDel()">\r\n        <i class="icon ng-class:{true: \'ion-android-delete\', false: \'ion-ios-trash-outline\'}[androidPlatform]"></i> Delete Account\r\n      </a>\r\n    </div>\r\n  </ion-content>\r\n</div>\r\n');
$templateCache.put('Settings/pages/account/customize.html','<ion-modal-view>\r\n  <ion-header-bar class="bar bar-header bar-theme" ng-click="closeModal()">\r\n    <div class="buttons buttons-left header-item">\r\n      <span class="left-buttons">\r\n      <button class="button button-icon button-clear ion-{{platformID}}-arrow-back"></button> \r\n      </span>\r\n    </div>\r\n    <h1 class="title">Customize</h1>\r\n  </ion-header-bar>\r\n  <ion-content>\r\n    <div class="item item-icon-left settings">\r\n      <i class="icon ion-navicon-round"></i> My Activity\r\n    </div>\r\n    <label class="item item-stacked-label" ng-click="">\r\n      <span class="input-label">Search Favorites</span>\r\n      <input type="text" placeholder="Prioritize what to find"></input>\r\n    </label>\r\n    <label class="item item-stacked-label">\r\n      <span class="input-label">Search Radius : {{radius.value}} km</span>\r\n      <div class="range">\r\n        <i class="icon ion-ios-search"></i>\r\n        <input type="range" name="volume" min="5" max="20" step="5" value="{{radius.value}}" ng-model="radius.value">\r\n        <i class="icon ion-{{platformID}}-search"></i>\r\n      </div>\r\n    </label>\r\n    <div class="item item-icon-left settings">\r\n      <i class="icon ion-paintbucket"></i> Theme\r\n    </div>\r\n    <div class="list">\r\n      <label class="item item-radio">\r\n          <input type="radio" name="group" value="def" ng-click="theme()">\r\n          <div class="radio-content">\r\n            <div class="item-content">\r\n              Default\r\n            </div>\r\n            <i class="radio-icon ion-checkmark"></i>\r\n          </div>\r\n        </label>\r\n      <label class="item item-radio">\r\n          <input type="radio" name="group" value="abyss" ng-click="theme(\'abyss\')">\r\n          <div class="radio-content">\r\n            <div class="item-content">\r\n              Abyss\r\n            </div>\r\n            <i class="radio-icon ion-checkmark"></i>\r\n          </div>\r\n        </label>\r\n      <label class="item item-radio">\r\n          <input type="radio" name="group" value="bloss" ng-click="theme(\'blossom\')">\r\n          <div class="radio-content">\r\n            <div class="item-content">\r\n              Blossom\r\n            </div>\r\n            <i class="radio-icon ion-checkmark"></i>\r\n          </div>\r\n        </label>\r\n      <label class="item item-radio">\r\n          <input type="radio" name="group" value="dune" ng-click="theme(\'dune\')">\r\n          <div class="radio-content">\r\n            <div class="item-content">\r\n              Dune\r\n            </div>\r\n            <i class="radio-icon ion-checkmark"></i>\r\n          </div>\r\n        </label>\r\n      <label class="item item-radio">\r\n          <input type="radio" name="group" value="ember" ng-click="theme(\'ember\')">\r\n          <div class="radio-content">\r\n            <div class="item-content">\r\n              Ember\r\n            </div>\r\n            <i class="radio-icon ion-checkmark"></i>\r\n          </div>\r\n        </label>\r\n      <label class="item item-radio">\r\n          <input type="radio" name="group" value="winter" ng-click="theme(\'winter\')">\r\n          <div class="radio-content">\r\n            <div class="item-content">\r\n              Winter\r\n            </div>\r\n            <i class="radio-icon ion-checkmark"></i>\r\n          </div>\r\n        </label>\r\n    </div>\r\n  </ion-content>\r\n</ion-modal-view>\r\n');
$templateCache.put('Settings/pages/account/delete.html','<ion-modal-view>\r\n  <ion-header-bar class="bar bar-header bar-theme" ng-click="closeModal()">\r\n    <div class="buttons buttons-left header-item">\r\n      <span class="left-buttons">\r\n      <button class="button button-icon button-clear ion-{{platformID}}-arrow-back"></button> \r\n      </span>\r\n    </div>\r\n    <h1 class="title">Delete Account</h1>\r\n  </ion-header-bar>\r\n  <ion-content>\r\n    <div class="list">\r\n      <div class="card">\r\n        <div id="accountdel" class="account-deletion">\r\n          <h5>IF YOU DELETE YOUR ACCOUNT YOU WILL:</h5>\r\n          <ul>\r\n            <li>Delete your account from SportsDrop</li>\r\n            <li>Not be able to recover your account</li>\r\n            <li>Delete your SportsDrop groups and activities</li>\r\n            <li>Need to create a new account to continue use</li>\r\n            <p></p>\r\n          </ul>\r\n        </div>\r\n      </div>\r\n      <div class="card">\r\n        <div class="account-deletion button button-bar" ng-click="confirmAccountDeletion()">DELETE MY ACCOUNT</div>\r\n      </div>\r\n    </div>\r\n  </ion-content>\r\n</ion-modal-view>\r\n');
$templateCache.put('Settings/pages/account/searches.html','<ion-modal-view>\r\n  <ion-header-bar class="bar bar-header bar-theme" ng-click="closeModal()">\r\n    <div class="buttons buttons-left header-item">\r\n      <span class="left-buttons">\r\n      <button class="button button-icon button-clear ion-{{platformID}}-arrow-back"></button> \r\n      </span>\r\n    </div>\r\n    <h1 class="title">Searches</h1>\r\n  </ion-header-bar>\r\n  <ion-content>\r\n  </ion-content>\r\n</ion-modal-view>\r\n');
$templateCache.put('Settings/pages/notifications/notifications.html','<div ng-controller="OptCtrl">\r\n  <ion-header-bar class="bar bar-header bar-theme" ui-sref="menu.settings">\r\n    <div class="buttons buttons-left header-item">\r\n      <span class="left-buttons">\r\n      <button class="button button-icon button-clear ion-{{platformID}}-arrow-back"></button> \r\n      </span>\r\n    </div>\r\n    <h1 class="title">Notifications</h1>\r\n  </ion-header-bar>\r\n  <ion-content>\r\n    <div class="list">\r\n      <ion-checkbox ng-model="filter.red">\r\n        Enable tones\r\n      </ion-checkbox>\r\n      <div class="item item-icon-left item-input item-stacked-label settings">\r\n        <span class="input-label">Message Notifications</span>\r\n        <div class="item-icon-left item-input item-stacked-label settings">\r\n          <span class="input-label">Tone type</span>\r\n          <a ng-model="msgTone" class="item" ng-click="toneList(\'message\')">{{msgTone}}</a>\r\n        </div>\r\n      </div>\r\n      <div class="item item-icon-left item-input item-stacked-label settings">\r\n        <span class="input-label">Group Notifications</span>\r\n        <div class="item-icon-left item-input item-stacked-label settings">\r\n          <span class="input-label">Tone type</span>\r\n          <a ng-model="grpTone" class="item" ng-click="toneList(\'group\')">{{grpTone}}</a>\r\n        </div>\r\n      </div>\r\n    </div>\r\n  </ion-content>\r\n</div>\r\n');
$templateCache.put('Settings/pages/notifications/tones.html','<ion-list>\r\n  <ion-radio ng-show="view === \'message\'" ng-model="msgTone" ng-repeat="tone in msgToneList" ng-click="selTone(tone, \'message\')">{{tone.name}}</ion-radio>\r\n  <ion-radio ng-show="view === \'group\'" ng-model="grpTone" ng-repeat="tone in grpToneList" ng-click="selTone(tone, \'group\')">{{tone.name}}</ion-radio>\r\n</ion-list>\r\n');
$templateCache.put('Settings/pages/profile/profile.html','<div ng-controller="OptCtrl" ng-init="profile()">\r\n  <ion-header-bar class="bar bar-header bar-theme" ui-sref="menu.settings">\r\n    <div class="buttons buttons-left header-item">\r\n      <span class="left-buttons">\r\n      <button class="button button-icon button-clear ion-{{platformID}}-arrow-back"></button> \r\n      </span>\r\n    </div>\r\n    <h1 class="title">Profile</h1>\r\n  </ion-header-bar>\r\n  <ion-content>\r\n    <div class="list card">\r\n      <div class="item">\r\n        <div class="row">\r\n          <div class="profile">\r\n            <img id="profile-pic" src="{{account.picture}}" ng-click="imageGallery()" style="box-shadow:none">\r\n          </div>\r\n        </div>\r\n      </div>\r\n      <div class="profile-content item item-body" style="padding:0">\r\n        <div class="sub-menu">\r\n          <button>{{account.name}}\r\n            <br>{{account.email}}\r\n          </button>\r\n        </div>\r\n      </div>\r\n    </div>\r\n    <div class="list">\r\n      <!--<a ng-show="fbAccount" class="item item-icon-left settings" ui-sref="profile">\r\n        <i class="icon ion-{{platformID}}-person"></i> About\r\n        <p>{{account.fb.about}}</p>\r\n      </a>-->\r\n      <a class="item item-icon-left settings" ui-sref="profile">\r\n        <i class="icon ion-{{platformID}}-people"></i> Community\r\n        <p>{{account.community.length}}</p>\r\n      </a>\r\n      <a ng-show="fbAccount" class="item item-icon-left settings" ui-sref="profile">\r\n        <i class="icon ion-social-facebook"></i> Connected\r\n      </a>\r\n      <!--<a ng-show="fbAccount" class="item item-icon-left settings" ui-sref="profile">\r\n        <i class="icon ion-{{platformID}}-person"></i> Favourite Sport\r\n        <p>{{account.fb.likes}}</p>\r\n      </a>-->\r\n      <a ng-show="!fbAccount" class="item item-icon-left settings" ng-click="takePicture()">\r\n        <i class="icon ion-image"></i> New Profile Pic\r\n        <p></p>\r\n      </a>\r\n    </div>\r\n  </ion-content>\r\n</div>\r\n');}]);
angular.module('directive.formatclock', [])

  .directive('formattedTime', function ($filter) {
    return {
      require: '?ngModel',
      link: function (scope, elem, attr, ngModel) {
        if (!ngModel)
          return;
        if (attr.type !== 'time')
          return;
        ngModel.$formatters.unshift(function (value) {
          // add on 30 minutes from now
          var date = new Date(Date(value));
          date = new Date((date.getTime() + 30 * 60000));
          value = date.toTimeString().split(' ')[0];
          return value.replace(/:[0-9]+$/, '');
        });
      }
    };
  });

angular.module('directive.map', [])

  .directive('map', function ($rootScope, $compile, $cordovaNetwork, $ionicPlatform,
    CustomUI, ConnectivityMonitor, GoogleMaps) {

    function link(scope, $element, $attr) {
      $ionicPlatform.ready(function () {
        var apiKey = MAP_KEY;

        // render map and intialize
        function initMap() {
          var mapElement = $element[0];
          var mapOptions = {
            zoom: 15,
            minZoom: 3,
            styles: MAP_STYLE,
            mapTypeId: google.maps.MapTypeId.ROADMAP
          };
          map = new google.maps.Map(mapElement, mapOptions);
          MAP_INSTANCE = map;
          // wait until the map is loaded
          google.maps.event.addListenerOnce(map, 'idle', function () {
            scope.onCreate({
              map: map
            });
          });
          google.maps.event.addDomListener(mapElement, 'mousedown', function (e) {
            e.preventDefault();
            return false;
          });
        }

        // disable map
        function disableMap() {
          var el = angular.element('<ion-view>' +
            '<ion-content>' + '<div class="empty-list">' +
            '<center><i class="icon ion-map"></i></center>' +
            '<center>Map cannot be displayed</center>' +
            '<center>Check network availability</center>' +
            '</div></ion-content>' + '</ion-view>');
          $compile(el)(scope);
          $element.append(el);
        }

        // load map api into DOM
        function loadGoogleMaps() {
          CustomUI.showSpinner($rootScope.platformID);
          // this function will be called once the SDK has been loaded
          window.mapInit = function () {
            initMap();
          };
          // create script element
          GoogleMaps.createMapScript(apiKey, 'mapInit');
        }

        // check map has loaded
        function checkLoaded() {
          if (typeof google == "undefined" || typeof google.maps == "undefined") {
            loadGoogleMaps();
          }
          if (document.readyState == "complete") {
            initMap();
          } else {
            google.maps.event.addDomListener(window, 'load', initMap);
          }
        }

        // listen for network status
        function addConnectivityListeners() {
          if (ionic.Platform.isWebView()) {
            // check if the map is already loaded when the user comes online
            $rootScope.$on('$cordovaNetwork:online', function (event, networkState) {
              checkLoaded();
            });
            // disable the map when the user goes offline
            $rootScope.$on('$cordovaNetwork:offline', function (event, networkState) {
              disableMap();
            });
          } else {
            // same as above but for when we are not running on a device
            window.addEventListener("online", function (e) {
              checkLoaded();
            }, false);
            window.addEventListener("offline", function (e) {
              disableMap();
            }, false);
          }
        }

        // run the above methods based on connectivity
        if (typeof apiKey != "undefined") {
          if (typeof google == "undefined" || typeof google.maps == "undefined") {
            disableMap();
            if (ConnectivityMonitor.isOnline()) {
              loadGoogleMaps();
            }
          } else {
            if (ConnectivityMonitor.isOnline()) {
              initMap();
            } else {
              disableMap();
            }
          }
          addConnectivityListeners();
        }
      });
    }
    return {
      restrict: 'E',
      scope: {
        onCreate: '&'
      },
      link: link
    };
  });

angular.module('directive.keyboard', [])

  .directive('input', function ($timeout) {
    return {
      restrict: 'E',
      scope: {
        'returnClose': '=',
        'onReturn': '&',
        'onFocus': '&',
        'onBlur': '&'
      },
      link: function (scope, element, attr) {
        element.bind('focus', function (e) {
          if (scope.onFocus) {
            $timeout(function () {
              scope.onFocus();
            });
          }
        });
        element.bind('blur', function (e) {
          if (scope.onBlur) {
            $timeout(function () {
              scope.onBlur();
            });
          }
        });
        element.bind('keydown', function (e) {
          if (e.which == 13) {
            if (scope.returnClose) element[0].blur();
            if (scope.onReturn) {
              $timeout(function () {
                scope.onReturn();
              });
            }
          }
        });
      }
    };
  });

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

angular.module('factory.networkstatus', [])

  .factory('ConnectivityMonitor', function ($rootScope, $cordovaNetwork) {
    return {
      isOnline: function () {
        if (ionic.Platform.isWebView()) {
          return $cordovaNetwork.isOnline();
        } else {
          return navigator.onLine;
        }

      },
      ifOffline: function () {
        if (ionic.Platform.isWebView()) {
          return !$cordovaNetwork.isOnline();
        } else {
          return !navigator.onLine;
        }
      }
    };
  });

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

angular.module('service.encryptdecrypt', [])

  .service('EncryptDecrypt', function ($q, RemoteHTTP) {

    // create image blobs for storage
    function createImgBlob(storage, session, resolve, reject) {
      var dataURL = "data:image/jpeg;base64," + session[0].profile.picture;
      blobUtil.dataURLToBlob(dataURL).then(function (blob) {
        session[0]._attachments = {
          'profile_pic.blob': {
            content_type: 'image/jpeg',
            data: blob
          }
        };
        return storage.bulkDocs(session);
      }).then(function (res) {
        // handle success
        return resolve(res);
      }).catch(function (err) {
        // handle error
        return reject(err);
      });
    }

    // set profile picture server-side
    function imgSrcConversion(image) {
      blobUtil.imgSrcToDataURL(image.src, 'image/jpeg',
        undefined, 1.0).then(function (dataURL) {
        Config.Session.profile.picture = dataURL.split(",")[1];
        return RemoteHTTP.setProfile(Config.Session);
      }).then(function () {
        var session = [];
        session.push(Config.Session);
        return $q(function (resolve, reject) {
          createImgBlob(configDB, session, resolve, reject);
        });
      }).then(function (res) {
        // handle success
      }).catch(function (err) {
        // handle errors
      });
    }

    // check image url encoding
    function imageEncoded(image) {
      firstCheck = typeof image === 'string';
      if (!firstCheck)
        return true;
      else {
        secondCheck = image !== DEFAULT_PICTURE;
        thirdCheck = !image.includes('http');
        if (firstCheck && secondCheck && thirdCheck)
          return true;
        else return false;
      }
    }

    // encrypt message before sending 
    function encrypt(message, group) {
      var tStamp = new Date();
      var mins = tStamp.getMinutes();
      mins = (mins >= 0 && mins <= 9) ? '0' + mins.toString() : mins.toString();
      var msg = group._id + '$%$' + JSON.stringify(tStamp.getHours()) +
        ':' + mins + '$%$' + JSON.stringify(Config.Session.profile.name) +
        '$%$' + JSON.stringify(message);
      return btoa(msg);
    }

    // decrypt incoming message
    function decrypt(message) {
      var decrypted = {
        timestamp: '',
        from: '',
        message: ''
      };
      stream = atob(message);
      decrypted.timestamp = stream.split('$%$')[1];
      decrypted.timestamp = decrypted.timestamp.replace(/\"/g, "");
      decrypted.from = stream.split('$%$')[2];
      decrypted.from = decrypted.from.replace(/\"/g, "");
      decrypted.message = stream.split('$%$')[3];
      decrypted.message = decrypted.message.replace(/\"/g, "");
      return decrypted;
    }

    return {
      createImgBlob: createImgBlob,
      imgSrcConversion: imgSrcConversion,
      imageEncoded: imageEncoded,
      encrypt: encrypt,
      decrypt: decrypt
    };
  });

angular.module('service.localstorage', [])

  .service('LocalHTTP', function ($q, $http, $window, $timeout, EncryptDecrypt) {

    // popup alert flag
    showPopup = false;

    // load username from storage
    function userName() {
      return $window.localStorage.getItem(APP_USERNAME);
    }

    // load application image
    function appLogo(stateName) {
      var img = '';
      switch (stateName) {
        case 'login':
          img = 'img/icon-logos/logo-white-text.png';
          break;
        case 'register':
          img = 'img/icon-logos/logo-blue.png';
          break;
      }
      return serviceUrl + img;
    }

    // verify data locally
    function verifyData(data, posting) {
      var dataState = {
        date: new Date(),
        state: true,
        msg: null
      };
      if (posting) {
        if ((data.game_activity == '') && posting) {
          dataState.msg = 'Please specify game';
        } else if (data.game_address == '' && posting) {
          dataState.msg = 'Please specify address';
        } else if (data.game_date == '') {
          dataState.msg = 'Please select a date';
        } else if (compareDate(data.game_date, dataState.date) == 1) {
          dataState.msg = 'Date must be set after ' + dataState.date.toString();
        }
      }
      if (dataState.msg != null)
        dataState.state = false;
      return dataState;
    }

    // verify user locally
    function verifyUser(data, loggingIn) {
      var dataState = {
        date: new Date(),
        state: true,
        msg: null
      };
      // login verification
      if (loggingIn) {
        if (!(data.name && data.password)) {
          dataState.msg = '';
          dataState.state = false;
        }
      } else {
        // registration verification
        if (!(data.email && data.name && data.password))
          dataState.msg = 'Invalid Email, Username or Password';
      }
      // password verification
      if (data.confirmpass) {
        if (data.password != data.confirmpass)
          dataState.msg = 'Passwords do not match. Try again';
      }
      if (dataState.msg != null)
        dataState.state = false;
      return dataState;
    }

    // auto search game types
    function searchGames(searchFilter) {
      return $q(function (resolve, reject) {
        var deferred = $q.defer();
        loadGameIcons().then(function (data) {
          var matches = data.filter(function (game) {
            if (game.tag_game_type.toLowerCase().indexOf(searchFilter.toLowerCase()) > NODATA)
              return true;
          });
          $timeout(function () {
            deferred.resolve(matches);
          }, 100);
          return resolve(deferred.promise);
        });
      });
    }

    // load data from storage
    function loadData(storage, field) {
      var sessionData = [];
      return $q(function (resolve, reject) {
        storage.allDocs({
          include_docs: true,
          attachments: field === 'session' ? true : false,
          binary: field === 'session' ? true : false
        }).then(function (res) {
          if (field === 'tags') {
            sessionData = res.rows.map(function (row) {
              return row.id;
            });
          } else if (field === 'session') {
            sessionData = res.rows.map(function (row) {
              return row.doc;
            });
          }
          return resolve(sessionData);
        });
      });
    }

    // load game icons
    function loadGameIcons() {
      return $q(function (resolve, reject) {
        $http.get(serviceUrl + 'res/json/game-icons.json').success(function (data) {
          return resolve(data);
        });
      });
    }

    // load game banner
    function loadGameBanner(game) {
      var imgUrl = 'img/banners/' + game + '.jpg';
      return serviceUrl + imgUrl;
    }

    // load search times
    function loadSearchTimes() {
      return $q(function (resolve, reject) {
        $http.get(serviceUrl + 'res/json/search-times.json').success(function (data) {
          return resolve(data);
        });
      });
    }

    // deposit data to storage
    function fillPouch(session, storage, where) {
      if (where == undefined)
        where = '';
      return $q(function (resolve, reject) {
        if (session) {
          switch (where) {
            case 'games':
              session.forEach(function (doc) {
                if (doc) {
                  doc.game_status_posted = true;
                  doc._rev = null;
                }
              });
              break;
            case 'groups':
              session.forEach(function (doc) {
                if (doc)
                  doc._rev = null;
              });
              break;
            case 'session':
              if (!session.profile.picture)
                session.profile.picture = Config.Session.profile.picture;
              var file = session;
              session = [];
              session.push(file);
              break;
          }
          if (where === 'session' && EncryptDecrypt.imageEncoded(session[0].profile.picture))
            EncryptDecrypt.createImgBlob(storage, session, resolve, reject);
          else if (where === 'community')
            communityStore(storage, session, resolve, reject);
          else {
            storage.bulkDocs(session).then(function (res) {
              // handle success
              return resolve(res);
            }).catch(function (err) {
              // handle error
              return reject(err);
            });
          }
        }
      });
    }

    // compact and destroy storage
    function emptyPouch(storage, name, adapter) {
      if (adapter == undefined)
        adapter = 'websql';
      storage.viewCleanup().then(function (state) {
        return storage.compact();
      }).then(function (state) {
        return storage.destroy();
      }).then(function (state) {
        var storage = new PouchDB(name, {
          adapter: adapter
        });
      }).catch(function (err) {});
    }

    // save community storage
    function communityStore(storage, session, resolve, reject) {
      var promises = session.map(function (profile) {
        if (profile.picture && !profile.fb) {
          var dataURL = "data:image/jpeg;base64," + profile.picture;
          return blobUtil.dataURLToBlob(dataURL);
        } else return profile.picture;
      });
      $q.all(promises).then(function (blobs) {
        for (var i = 0; i < blobs.length; i++) {
          if (blobs[i] && EncryptDecrypt.imageEncoded(blobs[i])) {
            session[i]._attachments = {
              'profile_pic.blob': {
                content_type: 'image/jpeg',
                data: blobs[i]
              }
            };
          }
        }
        return storage.allDocs();
      }).then(function (res) {
        var promises = res.rows.map(function (doc) {
          return storage.remove(doc.id, doc.value.rev);
        });
        return $q.all(promises);
      }).then(function (res) {
        return storage.bulkDocs(session);
      }).then(function (res) {
        // handle success
        return resolve(res);
      }).catch(function (err) {
        // handle success
        return reject(err);
      });
    }

    // load currency icons
    function currencies() {
      return $q(function (resolve, reject) {
        $http.get(serviceUrl + 'res/json/currency-icons.json').success(function (data) {
          return resolve(data);
        });
      });
    }

    // convert chrono-based words to Date object
    function convertDate(chronoWord) {
      var date = new Date();
      // adjust date based on chronoWord
      switch (chronoWord) {
        case 'Tommorrow':
          date.setDate(date.getDate() + 1);
          break;
        case '7 days':
          date.setDate(date.getDate() + 7);
          break;
        case '14 days':
          date.setDate(date.getDate() + 14);
          break;
        case '28 days':
          date.setDate(date.getDate() + 28);
          break;
        case '3 Months':
          date.setMonth(date.getMonth() + 3);
          break;
        case '6 Months':
          date.setMonth(date.getMonth() + 6);
          break;
        case 'Year':
          date.setFullYear(date.getFullYear() + 1);
          break;
        default:
          break;
      }
      // set time a minute before the start of next date
      date.setHours(23, 59, 59, 999);
      return date;
    }

    // date comparison function
    function compareDate(a, b) {
      if (a < b)
        return DATAOK;
      else if (a > b)
        return NODATA;
      else
        return 0;
    }

    // load notifications
    function toneNotifications(type) {
      var matches = [];
      return $http.get(serviceUrl + 'res/json/notification-tones.json').then(function (json) {
        json.data.forEach(function (tone) {
          if (tone.type === type)
            matches.push(tone);
        });
        return matches;
      });
    }

    return {
      userName: userName,
      appLogo: appLogo,
      verifyData: verifyData,
      verifyUser: verifyUser,
      searchGames: searchGames,
      fillPouch: fillPouch,
      loadGameIcons: loadGameIcons,
      loadGameBanner: loadGameBanner,
      loadSearchTimes: loadSearchTimes,
      loadData: loadData,
      emptyPouch: emptyPouch,
      currencies: currencies,
      convertDate: convertDate,
      showPopup: showPopup,
      toneNotifications: toneNotifications,
    };
  });

angular.module('service.pouchdb', [])

  .service('PouchDBListener', function ($rootScope) {

    // hold local database information of games here 
    var newList = [];

    // inital fetch of data from local database
    function fetchInitialDocs(database, renderView, options) {
      return database.allDocs({
        include_docs: true
      }).then(function (res) {
        newList = res.rows.map(function (row) {
          return row.doc;
        });
        renderView(newList, options);
      });
    }

    // react to only the data which has changed
    function reactToChanges(database, renderView, options) {
      database.changes({
        live: true,
        since: 'now',
        include_docs: true
      }).on('change', function (change) {
        var changes = [];
        if (change.deleted) {
          // change.id holds the deleted id
          onDeleted(change.id);
        } else { // updated/inserted
          // change.doc holds the new doc
          changes[0] = change.doc;
          onUpdatedOrInserted(changes[0]);
        }
        renderView(newList, options);
      }).on('error', console.log.bind(console));
    }

    // maintain order of games by date
    function binarySearch(arr, docId) {
      var low = 0,
        high = arr.length,
        mid;
      while (low < high) {
        mid = (low + high) >>> 1; // faster version of Math.floor((low + high) / 2)
        if (arr[mid]._id < docId)
          low = mid + 1;
        else high = mid;
      }
      return low;
    }

    // update UI when a game is deleted
    function onDeleted(id) {
      var index = binarySearch(newList, id);
      var doc = newList[index];
      if (doc && doc._id === id) {
        newList.splice(index, 1);
      }
    }

    // update UI when a game is updated/inserted
    function onUpdatedOrInserted(newDoc) {
      var index = binarySearch(newList, newDoc._id);
      var doc = newList[index];
      if (doc && doc._id === newDoc._id) { // update
        newList[index] = newDoc;
      } else { // insert
        newList.splice(index, 0, newDoc);
      }
    }

    // synchronise local database <=> UI
    function init(database, next, opt) {
      fetchInitialDocs(database, next, opt).then(reactToChanges(database, next, opt)).catch(console.log.bind(console));
      database.setMaxListeners(0);
    }

    return {
      listen: init
    };
  });

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

angular.module('factory.activityfilter', [])

  .factory('ActivityFilter', function () {
    var searchObj = {};
    var repeatID;
    return {
      repeatSearch: repeatID,
      prevSearch: searchObj
    };
  });

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

angular.module('factory.authinterceptor', [])

  .factory('AuthInterceptor', function ($rootScope, $q, AuthEvents) {
    return {
      responseError: function (response) {
        $rootScope.$broadcast({
          401: AuthEvents.notAuthorized,
          403: AuthEvents.notAuthenticated,
        }[response.status], response);
        return $q.reject(response);
      }
    };
  });

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

angular.module('factory.sessionintercept', [])

  .factory('SessionIntercept', function ($rootScope, $q, $interval, AuthService) {
    function hrMinSec(hr, min, sec) {
      hr = hr * 3600;
      min = min * 60;
      sec = sec * 1;
      return hr + min + sec;
    }
    var millis = 1000;
    var timer = hrMinSec(0, 10, 0) * millis;
    var session;
    return {
      startExpiryChecker: function () {
        session = $interval(function () {
          AuthService.checkSessionExpiration();
        }, timer);
      },
      stopExpiryChecker: function () {
        if (session)
          $interval.cancel(session);
      }
    };
  });

angular.module('factory.statehandler', [])

  .factory('StateHandler', function ($rootScope, $state, $window, App, AuthService, SessionIntercept) {
    on = function () {

      // check if user is authenticated before initializing the app
      if (!AuthService.isAuthenticated())
        $state.go('login');
      else {
        App.initConfig();
        $state.go('home');
      }

      $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState) {

        $rootScope.$state = $state;
        // first state is always the login state
        if (toState.name === 'login') {
          if (ionic.Platform.isWebView()) {
            screen.lockOrientation('portrait');
            StatusBar.backgroundColorByHexString('#128dd4');
            window.plugins.headerColor.tint('#3b53ba');
          }
          SessionIntercept.stopExpiryChecker();
        }

        // same as above but for state transitioning
        if (!AuthService.isAuthenticated()) {
          if (toState.name !== 'login' && toState.name !== 'register' &&
            toState.name !== 'resetpass') {
            event.preventDefault();
            $state.go('login');
          }
        } else {
          switch (toState.name) {
            case 'home':
              if (ionic.Platform.isWebView())
                screen.lockOrientation('portrait');
              SessionIntercept.startExpiryChecker();
              break;
            default:
              if (ionic.Platform.isWebView())
                screen.unlockOrientation();
              SessionIntercept.startExpiryChecker();
              break;
          }
        }
      });
    };

    return {
      $on: on
    };
  });

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

angular.module('service.camera', [])

  .service('Camera', function (EncryptDecrypt) {

    // take a picture
    snapPhoto = function () {
      if (ionic.Platform.isWebView()) {
        var srcType = Camera.PictureSourceType.CAMERA;
        var options = cameraOptions(srcType);

        navigator.camera.getPicture(onSuccess, onError, options);
      }
    };

    // open file gallery
    openGallery = function () {
      if (ionic.Platform.isWebView()) {
        var srcType = Camera.PictureSourceType.PHOTOLIBRARY;
        var options = cameraOptions(srcType);

        navigator.camera.getPicture(onSuccess, onError, options);
      }
    };

    // set camera options 
    function cameraOptions(srcType) {
      var options = {
        quality: 50,
        destinationType: Camera.DestinationType.FILE_URI,
        sourceType: srcType,
        encodingType: Camera.EncodingType.JPEG,
        mediaType: Camera.MediaType.PICTURE,
        allowEdit: true,
        correctOrientation: true
      };
      return options;
    }

    // success callback
    function onSuccess(imageURI) {
      var image = document.getElementById('profile-pic');
      image.src = imageURI;
      EncryptDecrypt.imgSrcConversion(image);
    }

    // error callback
    function onError(message) {
      console.error(message);
    }

    return {
      snapPhoto: snapPhoto,
      openGallery: openGallery
    };
  });

angular.module('service.customUI', [])

  .service('CustomUI', function ($q, $timeout, $ionicModal, $ionicLoading, $ionicPopup, $ionicPopover,
    NotificationListener, EncryptDecrypt) {

    // get array item index by 'key' attribute
    Array.prototype.getIndexBy = function (name, value) {
      for (var i = 0; i < this.length; i++) {
        if (this[i][name] == value) {
          return i;
        }
      }
      return NODATA;
    };

    // remove name duplicates
    Array.prototype.unique = function (a) {
      return Array.from(new Set(a));
    };

    // create modal interface
    function modalView(templateUrl, scope) {
      $ionicModal.fromTemplateUrl(templateUrl, {
        scope: scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        scope.modal = modal;
        scope.modal.show();
      }).catch(function (err) {
        // handle error
      });
      scope.closeModal = function () {
        scope.modal.hide();
      };
      // cleanup the modal when we're done with it!
      scope.$on('$destroy', function () {
        scope.modal.remove();
      });
      // execute action on hide modal
      scope.$on('modal.hidden', function () {
        // execute action
        scope.modal.remove();
      });
      // execute action on remove modal
      scope.$on('modal.removed', function () {
        // execute action
      });
    }

    // create popup views
    function formView(url, scope, buttons, title) {
      if (title == undefined)
        title = '';
      if (buttons == undefined)
        buttons = [];
      return $ionicPopup.show({
        title: title,
        templateUrl: url,
        scope: scope,
        buttons: buttons
      });
    }

    // create popover views
    function popView(url, scope) {
      $ionicPopover.fromTemplateUrl(url, {
        scope: scope
      }).then(function (popover) {
        scope.popover = popover;
        scope.popover.show();
      });
      // close the popover
      scope.closeActions = function () {
        scope.popover.hide();
      };
      // execute action on hidden popover
      scope.$on('popover.hidden', function (event) {
        // execute action
        scope.popover.remove();
      });
      // execute action on remove popover
      scope.$on('popover.removed', function (event) {
        // execute action
      });
    }

    // custom DOM rendering
    function renderView(arr, options) {
      var length, avatar;
      if (!options) {
        options = {
          scope: undefined,
          game_ls: false,
          group_ls: false,
          chat_ls: false
        };
      }
      // check falsy-hood in required arguments
      if (!options.scope || !arr)
        return;
      else if (Object.prototype.toString.call(arr) !== '[object Array]')
        return;
      // clear the list before render
      var displayThis = [];
      if (options.game_ls && !options.group_ls && !options.chat_ls) {
        // games list view rendering
        var games = arr;
        length = games.length;
        // only render if there are games to display
        if (length > 0) {
          for (var i = 0; i < length; i++) {
            var idx = options.scope.tag_game_type.indexOf(games[i].game_activity.trim());
            // check whether game has been posted or belongs to different user
            games[i].tag_game_posted_icon = '';
            if (games[i].game_host !== options.scope.host) {
              games[i].tag_game_posted_icon = 'ion-forward';
            } else if (games[i].game_status_posted == false) {
              games[i].tag_game_posted_icon = 'ion-android-time';
            } else {
              games[i].tag_game_posted_icon = 'ion-android-done';
            }
            // check whether game has been deleted
            if (games[i].game_status_deleted) {
              if (ionic.Platform.isIOS())
                games[i].tag_game_posted_icon = 'ion-ios-trash-outline';
              else games[i].tag_game_posted_icon = 'ion-android-delete';
            }
            if (idx >= 0)
              games[i].tag_game_avatar = options.scope.tag_game_avatar[idx];
            // format the date and time field
            var dateTimeTag = new Date(games[i].game_date);
            games[i].tag_date = dateTimeTag.toDateString();
            games[i].tag_time = dateTimeTag.getHours() + ':' + dateTimeTag.getMinutes();
            // check invitation status of the game
            if (games[i].game_players.pending.indexOf(options.scope.host) > NODATA)
              games[i].tag_invite = 'pending';
            else if (games[i].game_players.accepted.indexOf(options.scope.host) > NODATA)
              games[i].tag_invite = 'accepted';
            else if (games[i].game_players.rejected.indexOf(options.scope.host) > NODATA)
              games[i].tag_invite = 'rejected';
            else
              games[i].tag_invite = '';
            displayThis.push(games[i]);
          }
          options.scope.gamesList = displayThis;
        }
      } else if (!options.game_ls && options.group_ls && !options.chat_ls) {
        // group list view rendering
        var groups = arr;
        length = groups.length;
        options.scope.groupList = groups;
        options.scope.groups = options.scope.groupList;
      } else if (!options.game_ls && !options.group_ls && options.chat_ls) {
        // group chat view rendering
        var msg = {};
        var chats = arr;
        chats.forEach(function (chatLine) {
          // decode message
          var msg = EncryptDecrypt.decrypt(chatLine);
          // map avatar to message sender
          var idx = options.scope.community.getIndexBy("name", msg.from);
          if (idx > NODATA)
            avatar = options.scope.community[idx].picture;
          else if (Config.Session.profile.fb) {
            // map avatar to facebook users
            avatar = Config.Session.profile.fb.picture.data.url;
          }
          // display message to DOM
          displayThis.push({
            avatar: avatar || blobUtil.createObjectURL(Config.Session._attachments['profile_pic.blob'].data),
            timestamp: msg.timestamp,
            from: msg.from,
            message: msg.message
          });
        });
        options.scope.messages = displayThis;
      }
      // display this list to current scope
      if (!options.scope.$$phase) {
        // $digest or $apply
        options.scope.$apply();
      }
    }

    // action sheet messages 
    function actionButton(title, scope) {
      // show action sheet if iOS
      // return $q(function (resolve, reject) {
      //   $ionicActionSheet.show({
      //     titleText: title,
      //     buttons: [{
      //       text: 'Yes'
      //     }],
      //     destructiveText: 'Cancel',
      //     buttonClicked: function (e) {
      //       resolve(true);
      //       return true;
      //     },
      //     destructiveButtonClicked: function (e) {
      //       if (scope)
      //         scope.popover.hide();
      //       reject(true);
      //       return true;
      //     }
      //   });
      // });
      return $ionicPopup.confirm({
        title: title,
        okText: 'Yes',
        okType: 'button-save',
        cancelText: 'Cancel',
        cancelType: 'button-cancel'
      });
    }

    // alert messages
    function alert(title, message) {
      if (message == undefined)
        message = '';
      return $ionicPopup.alert({
        title: title,
        template: message,
        okType: 'button-save'
      });
    }

    // show toaster messages
    function toaster(message, timeout) {
      $ionicLoading.show({
        template: '<p>' + message + '</p>',
        animation: 'fade-in'
      });
      $timeout(function () {
        $ionicLoading.hide();
      }, timeout);
    }

    // change theme
    function theme(theme) {
      var statusbar = '#128dd4',
        href = '';
      var link = document.head.getElementsByClassName('theme');
      if (theme == 'abyss' || theme == 'blossom' ||
        theme == 'dune' || theme == 'ember' || theme == 'winter')
        href = 'css/themes/' + theme + '.css';
      else {
        theme = 'default';
        href = 'css/themes/' + theme + '.css';
      }
      link[0].href = href;
      Config.Session.settings.theme = theme;
      if (window.StatusBar) {
        switch (theme) {
          case 'abyss':
            statusbar = '#303f9f';
            break;
          case 'blossom':
            statusbar = '#c2185b';
            break;
          case 'dune':
            statusbar = '#ffa000';
            break;
          case 'ember':
            statusbar = '#d32f2f';
            break;
          case 'winter':
            statusbar = '#607d8b';
            break;
          case 'default':
            statusbar = '#128dd4';
            break;
        }
        $timeout(function () {
          StatusBar.backgroundColorByHexString(statusbar);
          window.plugins.headerColor.tint(statusbar);
        }, 150);
      }
      return true;
    }

    // change message and group tones
    function tones(tone, options) {
      if (!options.tones) options.tones = 'message';
      switch (options.tones) {
        case 'message':
          Config.Session.settings.message_tones = tone.url;
          break;
        case 'group':
          Config.Session.settings.group_tones = tone.url;
          break;
        default:
          break;
      }
      NotificationListener.SetTones();
      return tone.name;
    }

    // change search radius
    function searchRadius(value) {
      // convert to metres
      var metres = value * 1000;
      Config.Session.settings.search.radius = metres;
      return true;
    }

    // show loading spinner
    function showSpinner(type, title) {
      if (title == undefined)
        title = '';
      switch (type) {
        case 'android':
          $ionicLoading.show({
            title: title,
            template: '<ion-spinner icon="android"></ion-spinner>',
            noBackdrop: true
          });
          break;
        case 'ios':
          $ionicLoading.show({
            title: title,
            template: '<ion-spinner icon="ios"></ion-spinner>',
            noBackdrop: true
          });
          break;
      }
    }

    // hide loading spinner
    function hideSpinner() {
      $timeout(function () {
        $ionicLoading.hide();
      }, 50);
    }

    return {
      actionButton: actionButton,
      alert: alert,
      formView: formView,
      modalView: modalView,
      popView: popView,
      renderView: renderView,
      toaster: toaster,
      theme: theme,
      tones: tones,
      searchRadius: searchRadius,
      showSpinner: showSpinner,
      hideSpinner: hideSpinner,
    };
  });

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

angular.module('service.community', [])

  .service('Community', function ($q, LocalHTTP, RemoteHTTP) {

    // retrieve community data remotely
    function call(user, list) {
      var thisList = [];
      list.forEach(function (idx) {
        thisList.push(idx.name);
      });
      return $q(function (resolve, reject) {
        var community = null;
        RemoteHTTP.callCommunity(user, thisList).then(function (list) {
          Config.Session.profile.community = list.map(function (profile) {
            return profile.name;
          });
          list = list.map(function (profile) {
            if (profile.fb)
              profile.picture = profile.fb.picture.data.url;
            return profile;
          });
          return LocalHTTP.fillPouch(list, communityDB, 'community');
        }).then(function (res) {
          return communityDB.allDocs({
            include_docs: true
          });
        }).then(function (list) {
          var community = list.rows.map(function (row) {
            // overwrite picture for non-facebook users
            if (!row.doc.fb) {
              if (row.doc.picture)
                row.doc.picture = "data:image/jpeg;base64," + row.doc.picture;
              else // default to stock image if picture can't be found
                row.doc.picture = DEFAULT_PICTURE;
            }
            return row.doc;
          });
          return resolve(community);
        }).catch(function (err) {
          // handle errors
          reject(err);
        });
      });
    }

    // retrieve community data from config
    function data() {
      return $q(function (resolve, reject) {
        LocalHTTP.loadData(configDB, 'session').then(function (config) {
          var list = [];
          for (var i = 0; i < config[0].profile.community.length; i++)
            list.push({
              name: config[0].profile.community[i],
              blocked: false
            });
          resolve(list);
        }).catch(function (err) {
          // handle any errors
          reject(err);
        });
      });
    }

    // add member to the community
    function add(member) {
      var idx = Config.Session.profile.community.indexOf(member);
      if (idx === NODATA) {
        Config.Session.profile.community.push(member);
        LocalHTTP.fillPouch(Config.Session, configDB, 'session');
      }
      return $q(function (resolve, reject) {
        var community = Config.Session.profile.community;
        var user = LocalHTTP.userName();
        RemoteHTTP.callCommunity(user, community).then(function (list) {
          Config.Session.profile.community = list.map(function (profile) {
            return profile.name;
          });
          return LocalHTTP.fillPouch(list, communityDB, 'community');
        }).then(function (res) {
          return communityDB.get(res[0].id, {
            include_docs: true,
            attachments: true,
            binary: true
          });
        }).then(function (res) {
          res.picture = blobUtil.createObjectURL(res._attachments['profile_pic.blob'].data);
          return resolve(res);
        }).catch(function (err) {
          // handle errors
          reject(err);
        });
      });
    }

    // remove member from the community
    function remove(member) {
      var idx = Config.Session.profile.community.indexOf(member);
      Config.Session.profile.community.splice(idx, 1);
      LocalHTTP.fillPouch(Config.Session, configDB, 'session');
    }

    return {
      call: call,
      data: data,
      add: add,
      remove: remove,
    };
  });

angular.module('service.groups', ['factory.socketconnect'])

  .service('GroupsManager', function ($state, $q, CustomUI, RemoteHTTP, Community) {

    // begin listening to changes on a chat stream
    function initChat(group, scope) {
      // fetch the community list
      scope.community = scope.communityList;
      // load the group
      groupsDB.get(group._id, {
        include_docs: true
      }).then(function (info) {
        CustomUI.renderView(info.chats, {
          scope: scope,
          chat_ls: true
        });
      }).catch(function (err) {
        // handle error
      });
      // then listen for future updates
      groupsDB.changes({
        since: 'now',
        live: true,
        include_docs: true
      }).on('change', function (changes) {
        groupChanges = filterChanges(group, changes);
        CustomUI.renderView(groupChanges, {
          scope: scope,
          chat_ls: true
        });
      }).on('error', function (err) {
        // handle error
      });
    }

    // create a new group locally and remotely (scope relative)
    function createGroup(group, scope) {
      groupsDB.get(group._id).catch(function (err) {
        // handle error
        return groupsDB.put(group);
      }).then(function (res) {
        // success
        $state.go('menu.groups');
        // invite recipients
        sendInvite(group);
        // now store remotely
        return RemoteHTTP.createOrEdit(group);
      }).then(function () {
        // broadcast id on creating the group
        LiveSocket.emit('group_id', group._id);
      });
    }

    // delete a group locally and remotely (scope relative)
    function deleteGroup(group, scope) {
      var idx = group.members.indexOf(scope.user);
      group.members.splice(idx, 1);
      groupsDB.get(group._id).then(function (group) {
        idx = group.members.indexOf(scope.user);
        group.members.splice(idx, 1);
        delete group.chats;
        RemoteHTTP.createOrEdit(group);
        return group;
      }).then(function (group) {
        // delete the group locally
        return groupsDB.remove(group);
      }).then(function () {
        // leave group
        leaveGroup({
          _id: group._id,
          name: group.name,
          user: scope.user
        });
      }).catch(function (err) {
        // handle error
      });
    }

    // send and store group message (scope relative)
    function sendStoreMsg(message, scope) {
      groupsDB.get(scope.groupInfo._id, {
        include_docs: true
      }).then(function (doc) {
        doc.chats.push(message);
        return groupsDB.put(doc, doc._rev);
      }).then(function (res) {
        LiveSocket.emit('message_send', {
          _id: scope.groupInfo._id,
          message: message
        });
        scope.messageBox.text = null;
        scope.scrollContentToBottom();
      }).catch(function (err) {});
    }

    // filter changes only for the opened group 
    function filterChanges(group, change) {
      var fltrRes = [];
      if (change.doc._id === group._id)
        fltrRes = change.doc.chats;
      return fltrRes;
    }

    // send group invitations
    function sendInvite(group) {
      LiveSocket.emit('group_invite', group);
    }

    // leave current group
    function leaveGroup(group) {
      LiveSocket.emit('leave_group', group);
    }

    return {
      chatUI: initChat,
      invite: sendInvite,
      create: createGroup,
      delete: deleteGroup,
      leave: leaveGroup,
      sendMessage: sendStoreMsg
    };
  });

angular.module('factory.gmapmarkers', [])

  .factory('Markers', function ($q) {
    return {
      getMarkers: function () {
        return $q(function (resolve, reject) {
          activityDB.allDocs({
            include_docs: true
          }).then(function (result) {
            var length = result.rows.length;
            var markers = [];
            for (i = 0; i < length; i++)
              markers[i] = result.rows[i].doc;
            return resolve(markers);
          });
        });
      }
    };
  });

angular.module('service.geonavigation', [])

  .service('GeoNav', function ($window, $q, $cordovaGeolocation, RemoteHTTP, GoogleMaps) {

    // create marker and pulse animation
    var animatedOverlay;
    var userLocationMarker;

    // store infowindows
    var infoWindows = [];

    // save the users previous location
    var lastLoc;
    var latV = 51.507351;
    var lngH = -0.127758;
    var geolocation = {};

    // aqcuire user location
    function getUserLocation(mapScope) {

      if (userLocationMarker) {
        userLocationMarker.setMap(null);
      }
      if (animatedOverlay) {
        animatedOverlay.setMap(null);
      }

      return $q(function (resolve, reject) {
        var latLng = null;
        var options = {
          timeout: 5000,
          enableHighAccuracy: true
        };

        $cordovaGeolocation.getCurrentPosition(options).then(function (pos) {
          geolocation.lat = pos.coords.latitude;
          geolocation.lng = pos.coords.longitude;
          var markerIcon = {
            url: 'img/markers/locator/gps.png',
            scaledSize: new google.maps.Size(50, 50)
          };
          latLng = new google.maps.LatLng(geolocation.lat, geolocation.lng);
          lastLoc = latLng;
          $window.localStorage.setItem(DEVICE_LOCATION, [geolocation.lat, geolocation.lng]);

          var mapMarker = new google.maps.Marker({
            position: new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude),
            map: mapScope,
            icon: markerIcon,
            optimized: false
          });
          userLocationMarker = mapMarker;

          GoogleMaps.customMarker().then(function () {
            animatedOverlay = new GoogleMaps.animate({
              map: mapScope
            });
            animatedOverlay.bindTo('position', mapMarker, 'position');
            animatedOverlay.show();
          });
          resolve([latLng, mapMarker]);
        }, function (error) {
          var msg = 'This app wants you to change your device settings:';
          if (lastLoc) {
            latLng = lastLoc;
          } else
            latLng = new google.maps.LatLng(latV, lngH);
          reject([latLng, msg]);
        });
      });
    }

    // create a marker for a game
    function createGameMarker(mapScope, game, userGame) {
      var addr = game.game_address.split(" ").slice(0, 2).join(" ");
      var dt = new Date(game.game_date);
      var contentString = '<ion-item id="iw-container">' +
        '<h4 class="iw-title">' + addr.toString() +
        '<p class="iw-sub-header">' + dt.toDateString() + ' - ' +
        dt.toLocaleTimeString() + '</p>' + '</h4>' + '</ion-item>';
      var iconImg = 'img/markers/' + game.game_activity.toString() + '.png';

      return $q(function (resolve, reject) {
        geocode(game.game_address).then(function (results) {
          var gameLat = results[0].geometry.location.lat();
          var gameLng = results[0].geometry.location.lng();
          var latLng = new google.maps.LatLng(gameLat, gameLng);

          var mapMarker = new google.maps.Marker({
            position: latLng,
            icon: iconImg,
            map: mapScope
          });

          var infowindow = new google.maps.InfoWindow({
            content: contentString,
            maxWidth: 400
          });

          google.maps.event.addListener(mapMarker, 'click', function () {
            infoWindows.forEach(function (window) {
              window.close();
            });
            infoWindows = [];
            infowindow = new google.maps.InfoWindow({
              content: contentString,
              maxWidth: 400
            });
            infoWindows.push(infowindow);
            infowindow.open(map, mapMarker);
            google.maps.event.addListener(infowindow, 'domready', function () {
              GoogleMaps.applyInfoStyles();
            });
          });

          google.maps.event.addListener(map, "click", function () {
            infowindow.close();
          });

          if (userGame && mapScope != undefined)
            mapScope.setCenter(latLng);
          resolve({
            gameLat: gameLat,
            gameLng: gameLng,
            mapMarker: mapMarker,
            mapScope: mapScope
          });
        }, function (error) {
          // handle if could not resolve game location
          reject(error);
        });
      });
    }

    // convert address to latitude longitude coordinates
    function geocode(address) {
      return $q(function (resolve, reject) {
        var geocoder = new google.maps.Geocoder();
        var msg = 'Unknown Location. Try again.';

        places(address).then(function (place) {
          if (place.length == 1)
            address = place[0].formatted_address;
          else throw msg;
          return address;
        }).then(function (address) {
          geocoder.geocode({
            'address': address
          }, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK)
              resolve(results);
            else throw msg;
          });
        }).catch(function (err) {
          if (err == "UNKNOWN_ERROR")
            err = 'Network Unavailable';
          reject(err);
        });
      });
    }

    // retrieve place information from user input
    function places(address) {
      var request = {
        query: address,
      };
      var service = new google.maps.places.PlacesService(map);

      return $q(function (resolve, reject) {
        service.textSearch(request, placeList);

        function placeList(results, status) {
          if (status == google.maps.places.PlacesServiceStatus.OK)
            resolve(results);
          else reject(status);
        }
      });
    }

    // places autocompletion from user input
    function suggestAddresses(address) {
      var request = {
        input: address,
      };
      var geoLoc = $window.localStorage.getItem(DEVICE_LOCATION);
      if (geoLoc) {
        var lat = parseFloat(geoLoc.split(",")[0]);
        var lng = parseFloat(geoLoc.split(",")[1]);
        request.location = new google.maps.LatLng(lat, lng);
        request.radius = Config.Session.settings.search.radius;
      }
      var service = new google.maps.places.AutocompleteService();

      return $q(function (resolve, reject) {
        service.getPlacePredictions(request, displaySuggestions);

        function displaySuggestions(results, status) {
          if (status == google.maps.places.PlacesServiceStatus.OK) {
            var predictions = [];
            for (var i = 0; i < 3; i++) {
              if (results[i])
                predictions.push(results[i]);
            }
            resolve(predictions);
          } else reject(status);
        }
      });
    }

    return {
      location: getUserLocation,
      gameMarker: createGameMarker,
      placesAutocomplete: suggestAddresses
    };
  });

angular.module('service.map', [])

  .service('GoogleMaps', function ($q) {

    // create map instance
    function gmapLib() {
      var mapElement = document.getElementById('gmapLib');
      var mapOptions = {
        zoom: 15,
        minZoom: 3,
        styles: MAP_STYLE,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };
      map = new google.maps.Map(mapElement, mapOptions);
      MAP_INSTANCE = map;
    }

    // create script element to insert into the page
    function createMapScript(key, cb) {
      if (!cb)
        cb = '';
      var element = document.getElementById('googleMaps');
      if (typeof (element) != 'undefined' && element != null)
        return true;
      var script = document.createElement("script");
      script.type = "text/javascript";
      script.id = "googleMaps";
      // note the callback function in the URL is the one we created above
      if (key) {
        script.src = 'https://maps.google.com/maps/api/js?key=' + key +
          '&callback=' + cb + '&libraries=places';
      } else {
        script.src = 'https://maps.google.com/maps/api/js?&callback=' + cb + '&libraries=places';
      }
      document.body.appendChild(script);
    }

    // add information window css styling
    function applyInfoStyles() {
      // Reference to the DIV which receives the contents of the infowindow
      var iwOuter = document.getElementsByClassName('gm-style-iw');
      var iw = document.getElementById('iw-container');
      // Acquire children for iwOuter element and add custom class
      var iwOuterChild = iwOuter[0].children[0];
      iwOuterChild.classList.add('gm-style-iw-child');
      // Reference the previous DIV
      var iwBackground = iwOuter[0].previousElementSibling;
      // Remove the background shadow DIV
      iwBackground.children[1].style.display = 'none';
      // Remove the white background DIV
      iwBackground.children[3].style.display = 'none';
      // Modify the close button
      var iwClose = iwOuter[0].nextElementSibling;
      // iwClose.classList.add('iw-close-button');
      iwClose.innerHTML = '';
      iwClose.style.opacity = 1;
      iwClose.style.right = '62px';
      iwClose.style.top = '31px';
      iwClose.style.width = '20px';
      iwClose.style.height = '20px';
      iwClose.style.color = '#fff';
      iwClose.style.fontSize = '30px';
    }

    // create a customized animation for marker
    function customMarker() {
      return $q(function (resolve, reject) {
        if (google) {
          pinAnimation.prototype = new google.maps.OverlayView();
          pinAnimation.prototype.onAdd = function () {
            // overlay shadow puts the animation behind the pin
            var pane = this.getPanes().overlayShadow;
            pane.appendChild(this.div_);
            // ensures the animation is redrawn if the text or position is changed.
            var redraw_ = this;
            this.listeners_ = [
              google.maps.event.addListener(this, 'position_changed',
                function () {
                  redraw_.draw();
                }),
            ];
          };
          pinAnimation.prototype.onRemove = function () {
            this.div_.parentNode.removeChild(this.div_);
            // pinAnimation is removed from the map, stop updating its position/any other listeners added.
            for (var i = 0, I = this.listeners_.length; i < I; ++i) {
              google.maps.event.removeListener(this.listeners_[i]);
            }
          };
          pinAnimation.prototype.hide = function () {
            if (this.div_) {
              this.div_.style.visibility = 'hidden';
            }
          };
          pinAnimation.prototype.show = function () {
            if (this.div_) {
              this.div_.style.visibility = 'visible';
            }
          };
          pinAnimation.prototype.draw = function () {
            var topPadding = 0;
            var sizeHeight = 50;
            var sizeWidth = sizeHeight;
            var centerX = sizeWidth / 2;
            var centerY = sizeHeight / 2;
            var projection = this.getProjection();
            var position = projection.fromLatLngToDivPixel(this.get('position'));
            var div = this.div_;
            // adjust overlay position to be centered over the point
            div.style.left = position.x - centerX + 'px';
            div.style.top = position.y - topPadding - centerY + 'px';
            div.style.display = 'block';
          };
          return resolve(true);
        }
        return reject(false);
      });
    }

    // define the animated overlay
    function pinAnimation(options) {
      this.setValues(options);
      var div = this.div_ = document.createElement('div');
      var span = this.span_ = document.createElement('span');
      div.id = 'markerLoc';
      span.className = 'pulse';
      div.appendChild(span);
    }

    return {
      applyInfoStyles: applyInfoStyles,
      animate: pinAnimation,
      createMapScript: createMapScript,
      customMarker: customMarker,
      gmapLib: gmapLib
    };
  });

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

angular.module('controller.home', [])

  .controller('HomeCtrl', function ($window, $state, $rootScope, $scope, AuthService, LocalHTTP, CustomUI,
    NotificationListener, Facebook) {

    // account information
    $scope.account = {
      name: LocalHTTP.userName(),
      email: Config.Session.profile.email,
      picture: Config.Session.profile.picture,
      community: Config.Session.profile.community
    };

    // set profile picture
    if (Config.Session._attachments) {
      var picture = Config.Session._attachments['profile_pic.blob'].data;
      var image = document.getElementById('profile-pic');
      $scope.account.picture = blobUtil.createObjectURL(picture);
      image.src = $scope.account.picture;
    } else {
      LocalHTTP.loadData(configDB, 'session').then(function (config) {
        Config.Session = config[0];
        if (config[0]._attachments) {
          var url = config[0]._attachments['profile_pic.blob'].data;
          $scope.account.picture = blobUtil.createObjectURL(url);
        } else
          $scope.account.picture = Config.Session.profile.picture;
        var image = document.getElementById('profile-pic');
        image.src = $scope.account.picture;
      }).catch(function (err) {
        // handle errors
      });
    }

    // fetch notifications list
    $scope.notificationList = NotificationListener.List();

    // clear the notifications list
    $scope.clearAll = function () {
      $scope.notificationList = NotificationListener.clearList();
    };

    // logout of the application
    $scope.logout = function () {
      var sessionStore = null;
      var confirmPopup = CustomUI.actionButton('Logout');
      // if yes, then logout of the application
      confirmPopup.then(function (res) {
        if (res) {
          CustomUI.showSpinner($rootScope.platformID);
          if (Config.Session.profile.fb)
            Facebook.logout();
          AuthService.logout(LocalHTTP.userName()).then(function () {
            $state.go('login');
            CustomUI.hideSpinner();
          }).catch(function (err) {
            CustomUI.alert('Logout Failed');
            CustomUI.hideSpinner();
          });
        }
        if ($scope.popover)
          $scope.popover.hide();
      });
    };

    // tutorials page
    $scope.tutorial = function () {
      // show the modal view
      CustomUI.modalView('templates/Settings/pages/about/help.html', $scope);
    };

    // load tutorial on first introduction
    if (!$window.localStorage.getItem("_tutorial")) {
      $scope.tutorial();
      $window.localStorage.setItem("_tutorial", true);
    }
  });

angular.module('controller.login', [])

  .controller('LoginCtrl', function ($rootScope, $scope, $state, $ionicHistory, App, AuthService,
    LocalHTTP, CustomUI, Facebook, ionicMaterialInk) {

    // load image resources
    var stateURL = $state.current.name;
    $scope.logo = LocalHTTP.appLogo(stateURL);

    // existing user template
    $scope.user = {
      name: '',
      password: ''
    };

    // login existing user
    $scope.login = function () {
      var dataState = LocalHTTP.verifyUser($scope.user, true);
      if (dataState.state == false) {
        CustomUI.alert('Login Failed', dataState.msg);
        return false;
      }
      CustomUI.showSpinner($rootScope.platformID);
      AuthService.login($scope.user).then(function (res) {
        startUp();
      }, function (errMsg) {
        CustomUI.hideSpinner();
        CustomUI.alert('Login Failed', errMsg);
      });
    };

    // perform facebook login
    $scope.loginFB = function () {
      Facebook.login().then(function (fbUser) {
        CustomUI.showSpinner($rootScope.platformID);
        return AuthService.login(fbUser);
      }).then(function (res) {
        // handle success
        startUp();
      }).catch(function (err) {
        // handle error
        CustomUI.hideSpinner();
        CustomUI.alert('Login Failed');
      });
    };

    // proceed to home page
    function startUp() {
      $state.go('home');
      App.initConfig();
      $ionicHistory.nextViewOptions({
        disableAnimate: true,
        disableBack: true
      });
      CustomUI.hideSpinner();
    }

    ionicMaterialInk.displayEffect();
  });

angular.module('controller.resetpassword', [])

  .controller('ResetPassCtrl', function ($rootScope, $state, $scope, AuthService, CustomUI) {

    // existing user template

    $scope.user = {
      email: '',
      name: '',
      oldpassword: '',
      newpassword: '',
      confirmnewpass: ''
    };

    // reset user password
    $scope.resetPassword = function (user) {
      AuthService.resetPassword(user).then(function (msg) {
        $state.go('login');
        CustomUI.alert(msg, '');
        CustomUI.hideSpinner();
      }, function (errMsg) {
        CustomUI.hideSpinner();
        CustomUI.alert('Unable to reset password', errMsg);
      });
    };

  });

angular.module('controller.register', [])

  .controller('RegisterCtrl', function ($rootScope, $cordovaInAppBrowser, $scope, $state,
    AuthService, APIEndpoint, CustomUI, LocalHTTP, ionicMaterialInk) {

    // load image resources
    var stateURL = $state.current.name;
    $scope.logo = LocalHTTP.appLogo(stateURL);

    // new user template
    $scope.user = {
      email: '',
      name: '',
      password: '',
      confirmpass: ''
    };

    // register new user
    $scope.signup = function () {
      var dataState = LocalHTTP.verifyUser($scope.user);
      if (dataState.state == false) {
        CustomUI.alert('Registration Failed', dataState.msg);
        return false;
      }
      CustomUI.showSpinner($rootScope.platformID);
      AuthService.register($scope.user).then(function (msg) {
        $state.go('login');
        CustomUI.alert(msg, '');
        CustomUI.hideSpinner();
      }, function (errMsg) {
        CustomUI.hideSpinner();
        CustomUI.alert('Registration Failed', errMsg);
      });
    };

    // call app privacy policy
    $scope.openPolicy = function () {
      var link = APIEndpoint.www + '/legal/';
      var options = {
        location: 'no',
        clearcache: 'no',
        toolbar: 'no'
      };
      $cordovaInAppBrowser.open(link, '_blank', options)
        .then(function (event) {
          // success
        })
        .catch(function (event) {
          // error
        });
    };

    ionicMaterialInk.displayEffect();
  });

angular.module('controller.chat', [])

  .controller('ChatCtrl', function ($scope, $timeout, $ionicScrollDelegate, LocalHTTP, GroupsManager, EncryptDecrypt) {

    // set typing timeout to a second
    var TYPING_TIMER_LENGTH = 500;
    var typing = false;

    // handle user typing
    $scope.typist = "";
    $scope.typing = false;

    // scrolling to bottom handler
    $scope.scrollContentToBottom = function () {
      $timeout(function () {
        $ionicScrollDelegate.$getByHandle("chat-window").scrollBottom();
      }, 500);
    };

    // send message to group members
    $scope.sendMessage = function () {
      var encrypted = EncryptDecrypt.encrypt($scope.messageBox.text, $scope.groupInfo);
      GroupsManager.sendMessage(encrypted, $scope);
      $scope.$emit('socket:message_send');
    };

    // update the typing event
    $scope.sendTyping = function (user) {
      if (!typing) {
        typing = true;
        LiveSocket.emit('typing', {
          _id: $scope.groupInfo._id,
          typist: user
        });
      }
      lastTypingTime = (new Date()).getTime();
      $timeout(function () {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          LiveSocket.emit('stopTyping', {
            _id: $scope.groupInfo._id,
            typist: user
          });
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    };

    // check for received messages
    $scope.$on('socket:message_received', function () {
      $scope.scrollContentToBottom();
    });

    // show the typing message
    LiveSocket.on('typing', function (typist) {
      if (typist !== $scope.user) {
        $scope.typing = true;
        $scope.typist = typist;
      }
    });

    // stop the typing message
    LiveSocket.on('stopTyping', function (typist) {
      if (typist !== $scope.user) {
        $scope.typing = false;
        $scope.typist = "";
      }
    });

  });

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

angular.module('sportsdrop', [
    'ngCordova', 'ionic', 'client',
    'ionic-material', 'ionMdInput',
    'controller.login',
    'controller.resetpassword',
    'controller.register',
    'controller.menu',
    'controller.home',
    'service.authorization',
    'service.notificationlistener',
    'service.pushservice',
    'service.encryptdecrypt',
    'factory.appinit',
    'factory.authinterceptor',
    'factory.facebook',
    'factory.sessionintercept',
    'factory.socketconnect',
    'factory.statehandler',
    'templates'
  ])

  .controller('AppCtrl', function ($rootScope, $scope, $state, LocalHTTP,
    AuthService, AuthEvents, CustomUI, ionicMaterialInk) {

    // react to authorization issues
    // $scope.$on(AuthEvents.notAuthorized, function (event) {
    //   $state.go('login');
    //   CustomUI.alert('Not Authorized');
    //   AuthService.logout(LocalHTTP.userName()).then(function () {
    //   });
    // });

    // react to authentication issues
    $scope.$on(AuthEvents.notAuthenticated, function (event) {
      AuthService.logout(LocalHTTP.userName()).then(function () {
        $state.go('login');
        CustomUI.alert('Session Timeout');
      });
    });

    // apply ink effect to all styles
    $scope.inkColor = function () {
      return '#cccccc';
    };

    // apply platform id to all styles and icons
    if (ionic.Platform.isIOS()) {
      $rootScope.androidPlatform = false;
      $rootScope.platformID = 'ios';
    } else {
      $rootScope.androidPlatform = true;
      $rootScope.platformID = 'android';
    }

    ionicMaterialInk.displayEffect();
  })

  .config(function ($stateProvider, $httpProvider, $urlRouterProvider, $ionicConfigProvider) {
    $ionicConfigProvider.scrolling.jsScrolling(false);
    $stateProvider
      .state('login', {
        cache: false,
        url: '/login',
        templateUrl: 'templates/App/pages/login/login.html',
        controller: 'LoginCtrl'
      })
      .state('resetpass', {
        url: '/resetpass',
        templateUrl: 'templates/App/pages/password/password.html',
        controller: 'ResetPassCtrl'
      })
      .state('register', {
        url: '/register',
        templateUrl: 'templates/App/pages/register/register.html',
        controller: 'RegisterCtrl'
      })
      .state('home', {
        cache: false,
        url: '/home',
        templateUrl: 'templates/App/pages/home/home.html',
        controller: 'HomeCtrl'
      })
      .state('menu', {
        abstract: true,
        url: '/menu',
        templateUrl: 'templates/Menu/menu.html',
        controller: 'MenuCtrl'
      })
      .state('menu.map', {
        url: '/map',
        templateUrl: 'templates/Map/map.html',
        controller: 'MapCtrl'
      })
      .state('menu.activities', {
        cache: false,
        url: '/activities',
        templateUrl: 'templates/Activity/activities.html',
        controller: 'ActivityCtrl'
      })
      .state('menu.groups', {
        url: '/groups',
        templateUrl: 'templates/Groups/groups.html',
        controller: 'GroupCtrl'
      })
      .state('menu.settings', {
        url: '/settings',
        templateUrl: 'templates/Settings/settings.html',
        controller: 'OptCtrl'
      })
      .state('about', {
        url: '/settings/about',
        templateUrl: 'templates/Settings/pages/about/about.html'
      })
      .state('account', {
        url: '/settings/account',
        templateUrl: 'templates/Settings/pages/account/account.html'
      })
      .state('activities-details', {
        cache: false,
        url: 'activities/details',
        params: {
          Params: null
        },
        templateUrl: 'templates/Activity/pages/details/activity-info.html',
        controller: 'ActDetailsCtrl'
      })
      .state('community', {
        url: '/groups/community',
        templateUrl: 'templates/Groups/pages/community/community.html'
      })
      .state('new-group', {
        cache: false,
        url: '/groups/new-group',
        templateUrl: 'templates/Groups/pages/new-group/new-group.html'
      })
      .state('notifications', {
        url: '/settings/notifications',
        templateUrl: 'templates/Settings/pages/notifications/notifications.html'
      })
      .state('profile', {
        cache: false,
        url: '/settings/profile',
        templateUrl: 'templates/Settings/pages/profile/profile.html',
        params: {
          info: null
        }
      });
    $urlRouterProvider.otherwise('/login');
    $httpProvider.interceptors.push('AuthInterceptor');
  })

  .run(function (
    $ionicPlatform, App, AuthService, AuthEvents, StateHandler, Facebook) {
    isCordova = function (callback) {
      if (window.cordova) {
        document.addEventListener("deviceready", function () {
          callback();
        });
      } else {
        $ionicPlatform.ready(function () {
          callback();
        });
      }
    };
    isCordova(function () {
      StateHandler.$on();
      App.initMap('AIzaSyB16sGmIekuGIvYOfNoW9T44377IU2d2Es');
      if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
        cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
        cordova.plugins.Keyboard.disableScroll(true);
      }
      if (window.StatusBar) {
        StatusBar.backgroundColorByHexString("#128dd4");
        window.plugins.headerColor.tint('#3b53ba');
      }
      if (ionic.Platform.isWebView()) {
        screen.lockOrientation('portrait');
      }
      if (ionic.Platform.isAndroid() && ionic.Platform.isWebView()) {
        serviceUrl = 'file:///android_asset/www/';
      }
      Facebook.init({
        appId: '419650108398981'
      });
    });
  });

//////////////////////////////////////////////////////////////////
//                                                              //
//  Author: Isaak Smart                                         //
//  Date: 05/08/2016                                            //
//                                                              //
//  Description: Sportsdrop Ionic/Angular Client Side App       //
//               This will provide the front end UI             //
//               as well the core functionality for             //
//               posting and searching for games.               // 
//                                                              //
//////////////////////////////////////////////////////////////////

// create local games database
var activityDB = new PouchDB(games_storage, {
  adapter: 'websql'
});

// create local groups database
var groupsDB = new PouchDB(groups_storage, {
  adapter: 'websql',
  auto_compaction: true
});

// create community list database
var communityDB = new PouchDB(community_storage, {
  adapter: 'websql'
});

// create configurations file
var configDB = new PouchDB(config_storage, {
  adapter: 'websql'
});

// register global constants and events
angular.module('client', [])

  .constant('AuthEvents', {
    notAuthenticated: 'auth-not-authenticated',
    notAuthorized: 'auth-not-authorized'
  })

  .constant('APIEndpoint', {
    url: server.connect('prod', 'http'),
    www: server.connect('web', 'http')
  });

angular.module('controller.groups', ['controller.chat', 'service.groups', 'service.community'])

  .controller('GroupCtrl', function ($rootScope, $scope, $filter, $timeout,
    CustomUI, GroupsManager, PouchDBListener, LocalHTTP, Community, Facebook) {

    $scope.search = {};
    $scope.user = LocalHTTP.userName();
    $scope.group = {
      name: '',
      caption: ''
    };

    // search through list of available groups
    $scope.searchGroups = function (referenceList) {
      var list = referenceList;
      var filterRes = [];
      list.forEach(function (data) {
        if (data) {
          var fltr = $filter('uppercase')($scope.search.res);
          var feed = $filter('uppercase')(data.name);
          if (feed.indexOf(fltr) >= 0)
            filterRes.push(data);
        }
      });
      return filterRes;
    };

    // create a new group
    $scope.newGroup = function () {
      // make api call to FB for friends list (request explicit granted permission)
      Facebook.getLoginStatus().then(function (result) {
        if (result.status === 'connected') {
          return Facebook.graphAPI({
            edge: 'permissions'
          });
        }
      }).then(function (res) {
        // handle result
        return Facebook.graphAPI({
          edge: 'friends'
        });
      }).then(function (res) {
        // handle success
      }).catch(function (res) {
        // handle error
      });

      // generate a unique group id
      var id = new Date();
      var memberNames = [];
      $scope.chats = [];
      $scope.memberList = [];

      // add members to the group
      $scope.addMember = function (person) {
        var idx = $scope.persons.indexOf(person);
        // make sure the user cannot add the same member more than once
        if ($scope.memberList.indexOf(person.name) < 0) {
          $scope.memberList.push(person);
          memberNames.push(person.name);
          $scope.persons.splice(idx, 1);
        } else return;
      };

      // remove members from the group
      $scope.removeMember = function (member) {
        var idx = $scope.memberList.indexOf(member);
        // sanity check to ensure member is indeed in the list before removal
        if (idx >= 0) {
          $scope.memberList.splice(idx, 1);
          memberNames.splice(idx, 1);
          $scope.persons.push(member);
        } else return;
      };

      // confirm group information
      $scope.goConfirm = function () {

        // cannot create empty groups
        if ($scope.memberList.length <= 0) {
          CustomUI.toaster('You must add at least 1 person', 2000);
          return false;
        }

        // show the confirm group view
        CustomUI.modalView('templates/Groups/pages/new-group/confirm-group.html', $scope);

        // confirm group information
        $scope.clickOK = function () {
          if ($scope.group.name === '') {
            CustomUI.toaster('You must add a group name', 2000);
            return false;
          }
          memberNames.push($scope.user);
          var newGroup = {
            _id: id.toJSON(),
            admin: $scope.user,
            caption: $scope.group.caption,
            chats: $scope.chats,
            members: memberNames,
            name: $scope.group.name,
            size: memberNames.length,
          };
          GroupsManager.create(newGroup, $scope);
        };
      };

      // retrieve users community
      $scope.community();
    };

    // open existing group to start chat service
    $scope.openGroup = function (group) {

      // assign group information to local scope
      $scope.groupInfo = group;

      // populate chat list with user messages
      $scope.messages = [];
      $scope.messageBox = {};

      // initialize chat feed for the current group
      GroupsManager.chatUI($scope.groupInfo, $scope);

      // show the modal view
      CustomUI.modalView('templates/Groups/pages/chat/chat.html', $scope);

      // broadcast id on opening the chat window
      LiveSocket.emit('group_id', group._id);

      // --- TODOS --- //
      // add new member to group (must be group leader)
      // delete member from group (must be group leader)
      // leave group
    };

    // delete a group
    $scope.deleteGroup = function (group) {
      CustomUI.actionButton('Delete Group ?').then(function (res) {
        if (res) {
          // sanity check to see if group is in the list
          if ($scope.groups.indexOf(group) > -1)
            GroupsManager.delete(group, $scope);
          else throw false;
        }
      }).catch(function (err) {
        // handle error
      });
    };

    // display all groups to the user
    $scope.updateGroupsList = function () {
      // synchronise local database to UI
      PouchDBListener.listen(groupsDB, CustomUI.renderView, {
        scope: $scope,
        group_ls: true
      });
    };

    // check for group invitations
    $scope.$on('socket:group_invitation', function (e, data) {
      // broadcast id on receiving the invite
      LiveSocket.emit('group_id', data._id);
    });

    // check for users who have left the group
    $scope.$on('socket:left_group', function (e, data) {
      if ($scope.groupInfo) {
        var idx = $scope.groupInfo.members.indexOf(data.user);
        $scope.groupInfo.members.splice(idx, 1);
      }
      CustomUI.toaster(data.user + ' has left ' + data.name, 2000);
    });

    // populate list of names from the community
    $scope.community = function () {
      Community.data().then(function (list) {
        $scope.communityList = list;
        community($scope.communityList);
      });
    };

    // retrieve list of people from the community
    community = function (communityList) {
      CustomUI.showSpinner($rootScope.platformID);
      // make api call to FB for friends list (request explicit granted permission)
      Facebook.getLoginStatus().then(function (result) {
        if (result.status === 'connected') {
          return Facebook.graphAPI({
            edge: 'permissions'
          });
        }
      }).then(function (res) {
        // handle result
        return Facebook.graphAPI({
          edge: 'friends'
        });
      }).then(function (res) {
        // handle success
      }).catch(function (res) {
        // handle error
      });

      // make api call to SD community
      Community.call($scope.user, communityList).then(function (list) {
        CustomUI.hideSpinner();
        $scope.persons = $scope.communityList = list;
      }).catch(function (err) {
        CustomUI.hideSpinner();
      });

      // block person from your community
      $scope.blockPerson = function (person) {
        var confirm = CustomUI.actionButton('Are you sure ?');
        confirm.then(function (res) {
          if (res) {
            var idx = $scope.communityList.getIndexBy("name", person.name);
            if (idx > NODATA) {
              $scope.communityList[idx].blocked = true;
              $scope.persons = $scope.communityList;
            }
          } else
            return;
        });
      };

      // unblock person from your community
      $scope.unBlockPerson = function (person) {
        var idx = $scope.communityList.getIndexBy("name", person.name);
        if (idx > NODATA) {
          $scope.communityList[idx].blocked = false;
          $scope.persons = $scope.communityList;
        }
      };
    };
    $scope.community();
  });

angular.module('controller.map', [])

  .controller('MapCtrl', function ($rootScope, $scope, $state, $ionicSlideBoxDelegate, CustomUI,
    GeoNav, Markers, LocalHTTP, ionicMaterialInk) {

    // improve rendering speed during transitions
    $scope.$on('$ionicView.afterEnter', function () {
      $scope.showMap = true;
    });
    $scope.$on('$ionicView.beforeLeave', function () {
      $scope.showMap = false;
    });

    // render the google map
    $scope.mapCreated = function (map) {
      $scope.map = map;
      // automatic geolocation
      if ($scope.map) {
        var latLng = null;
        Markers.getMarkers().then(function (markers) {
          markers.forEach(function (marker) {
            GeoNav.gameMarker($scope.map, marker, null);
          });
        });
        $scope.centerOnUser();
      }
    };

    // get the current location of the user
    $scope.centerOnUser = function ($event) {
      var alertPopup;
      // execute alert when location icon is pressed
      if (!$scope.map) {
        return;
      }
      CustomUI.showSpinner($rootScope.platformID, 'Loading Position...');
      GeoNav.location($scope.map).then(function (result) {
        latLng = result[0];
        $scope.map.setCenter(latLng);
        CustomUI.hideSpinner();
      }).catch(function (error) {
        latLng = error[0];
        $scope.map.setCenter(latLng);
        CustomUI.hideSpinner();
        if ($state.current.name === 'menu.map') {
          if (!LocalHTTP.showPopup) {
            LocalHTTP.showPopup = true;
            alertPopup = CustomUI.alert(error[1], 'Use GPS, Wi-Fi and mobile networks to access your location');
          }
          alertPopup.then(function (closed) {
            LocalHTTP.showPopup = !closed;
          });
        }
      });
    };

    ionicMaterialInk.displayEffect();
  });

angular.module('controller.menu', [
    'controller.map',
    'controller.activity',
    'controller.activity-info',
    'controller.groups',
    'controller.settings',
    'directive.map',
    'directive.formatclock',
    'directive.keyboard',
    'service.map',
    'service.geonavigation',
    'service.localstorage',
    'service.REST',
    'service.customUI',
    'service.pouchdb',
    'service.activity',
    'factory.activityfilter',
    'factory.gmapmarkers',
    'factory.networkstatus'
  ])

  .controller('MenuCtrl', function ($rootScope, $scope, $state, CustomUI) {

    // present a list of useful actions no matter which state
    $scope.openActions = function () {
      // close the popover
      $scope.closeActions = function () {
        $scope.popover.hide();
      };
      CustomUI.popView('templates/Menu/pages/pop-menu.html', $scope);
    };

    // automatically close actions list when navigating away
    $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState) {
      var path = fromState.url;
      // do not execute when navigating from a nested state
      if ((toState.name === 'menu.settings') && (!path.includes("/settings/") && !path.includes("/home"))) {
        $scope.closeActions();
        return;
      }
      if (path.includes("/settings/")) {
        $state.go('menu.settings');
        return;
      }
      if ($scope.closeActions)
        $scope.closeActions();
      return;
    });
  });

angular.module('controller.settings', ['service.camera'])

  .controller('OptCtrl', function ($window, $rootScope, $scope, $state, $stateParams, $timeout,
    $cordovaInAppBrowser, AuthService, APIEndpoint, LocalHTTP, RemoteHTTP, CustomUI, Camera,
    NotificationListener, Facebook, ionicMaterialInk) {

    // set notification tones
    $scope.msgTone = 'Default';
    $scope.grpTone = 'Default';
    $scope.fbAccount = Config.Session.profile.fb ? true : false;

    // account information
    $scope.account = {
      name: LocalHTTP.userName(),
      email: Config.Session.profile.email,
      picture: Config.Session.profile.picture,
      community: Config.Session.profile.community,
      // facebook account fields
      fb: fbProfile()
    };

    // account deletion page
    $scope.accountDel = function () {
      // confirm once more for user to delete account
      $scope.confirmAccountDeletion = function () {
        // if yes, then delete user account
        var confirmPopup = CustomUI.actionButton('Last chance, are you sure ?');
        confirmPopup.then(function (res) {
          if (res) {
            var thisUser = {
              name: LocalHTTP.userName(),
              email: Config.Session.profile.email
            };
            CustomUI.showSpinner($rootScope.platformID);
            AuthService.deleteAccount(thisUser).then(function (res) {
              $scope.closeModal();
              $state.go('login');
              CustomUI.hideSpinner();
            }).catch(function (err) {
              console.error('error deleting your account ' + err);
            });
          } else
            return true;
        });
      };
      // show the modal view
      CustomUI.modalView('templates/Settings/pages/account/delete.html', $scope);
    };

    // call app licenses
    $scope.licenses = function () {
      var link = APIEndpoint.www + '/licenses/';
      var options = {
        location: 'no',
        clearcache: 'no',
        toolbar: 'no'
      };
      $cordovaInAppBrowser.open(link, '_blank', options)
        .then(function (event) {
          // success
        })
        .catch(function (event) {
          // error
        });
    };

    // call app privacy policy
    $scope.openPolicy = function () {
      var link = APIEndpoint.www + '/legal/';
      var options = {
        location: 'no',
        clearcache: 'no',
        toolbar: 'no'
      };
      $cordovaInAppBrowser.open(link, '_blank', options)
        .then(function (event) {
          // success
        })
        .catch(function (event) {
          // error
        });
    };

    // customize app page
    $scope.customize = function () {
      // change search radius
      $scope.radius = {
        value: Config.Session.settings.search.radius / 1000
      };
      $scope.$watch('radius.value', function (newVal, oldVal) {
        $scope.radius.value = parseInt(newVal);
        CustomUI.searchRadius($scope.radius.value);
      });
      // change theme settings
      $scope.theme = function (theme) {
        var result = CustomUI.theme(theme);
        // store changes to config storage
        LocalHTTP.fillPouch(Config.Session, configDB, 'session');
      };
      // show the modal view
      CustomUI.modalView('templates/Settings/pages/account/customize.html', $scope);
    };

    // tutorials page
    $scope.tutorial = function () {
      // show the modal view
      CustomUI.modalView('templates/Settings/pages/about/help.html', $scope);
    };

    // profile page
    $scope.profile = function () {
      // gather profile information
      var params = $stateParams.info,
        profilePicture = null;
      // set profile picture
      var image = document.getElementById('profile-pic');
      if (params) {
        $scope.account = params;
        profilePicture = params._attachments['profile_pic.blob'].data;
        $scope.account.picture = blobUtil.createObjectURL(profilePicture);
        image.src = $scope.account.picture;
      } else {
        if (Config.Session._attachments) {
          profilePicture = Config.Session._attachments['profile_pic.blob'].data;
          $scope.account.picture = blobUtil.createObjectURL(profilePicture);
          image.src = $scope.account.picture;
        } else {
          LocalHTTP.loadData(configDB, 'session').then(function (config) {
            Config.Session = config[0];
            if (config[0]._attachments) {
              profilePicture = config[0]._attachments['profile_pic.blob'].data;
              $scope.account.picture = blobUtil.createObjectURL(profilePicture);
            }
            image.src = $scope.account.picture;
          }).catch(function (err) {
            // handle errors
          });
        }
      }
    };

    // use camera to take picture
    $scope.takePicture = function () {
      Camera.snapPhoto();
    };

    // open image gallery to choose picture
    $scope.imageGallery = function () {
      Camera.openGallery();
    };

    // submit feedback about the app
    $scope.contactUs = function () {
      $scope.feedback = {
        from: LocalHTTP.userName(),
        comments: ''
      };
      // buttons for the feedback template
      $scope.feedbackButtons = function (feedback) {
        return [{
          text: 'Cancel',
          type: 'button-cancel'
        }, {
          text: 'Submit',
          type: 'button-save',
          onTap: function (e) {
            var msg = '';
            if (feedback.comments) {
              RemoteHTTP.contactUs(feedback).then(function (msg) {
                CustomUI.alert('Thank you', msg);
              }).catch(function (msg) {
                CustomUI.alert('Status', msg);
              });
            } else {
              msg = 'Cannot leave comments empty';
              e.preventDefault();
              CustomUI.toaster(msg, 2000);
            }
          }
        }];
      };
      // create game from template
      var popupCtrl = CustomUI.formView('templates/Settings/pages/feedback.html',
        $scope, $scope.feedbackButtons($scope.feedback), 'Contact us');
    };

    // tone list page
    $scope.toneList = function (view) {

      // set view flags
      var title = '',
      idx;
      $scope.view = view;

      // populate with either message or group tones
      switch (view) {
        case 'message':
          title = 'Message Tones';
          $scope.prevTone = $scope.msgTone;
          LocalHTTP.toneNotifications('message').then(function (tones) {
            $scope.msgToneList = tones;
          });
          break;
        case 'group':
          title = 'Group Tones';
          $scope.prevTone = $scope.grpTone;
          LocalHTTP.toneNotifications('group').then(function (tones) {
            $scope.grpToneList = tones;
          });
          break;
      }

      // buttons for the tone list
      $scope.toneListBtns = function () {
        return [{
          text: 'Cancel',
          type: 'button-cancel',
          onTap: function (e) {
            switch ($scope.view) {
              case 'message':
                $scope.msgTone = $scope.prevTone;
                idx = $scope.msgToneList.getIndexBy("name", $scope.prevTone);
                CustomUI.tones($scope.msgToneList[idx], {
                  tones: 'message'
                });
                break;
              case 'group':
                $scope.grpTone = $scope.prevTone;
                idx = $scope.grpToneList.getIndexBy("name", $scope.prevTone);
                CustomUI.tones($scope.grpToneList[idx], {
                  tones: 'group'
                });
                break;
            }
            return true;
          }
        }, {
          text: 'Apply',
          type: 'button-save',
          onTap: function (e) {
            return true;
          }
        }];
      };

      // tone selector
      $scope.selTone = function (tone, type) {
        switch (type) {
          case 'message':
            $scope.msgTone = CustomUI.tones(tone, {
              tones: 'message'
            });
            break;
          case 'group':
            $scope.grpTone = CustomUI.tones(tone, {
              tones: 'group'
            });
            break;
        }
        NotificationListener.Demo(type);
      };

      // show the tones list view
      CustomUI.formView('templates/Settings/pages/notifications/tones.html', $scope,
        $scope.toneListBtns(), title);
    };

    // logout of the application
    $scope.logout = function () {
      var sessionStore = null;
      var confirmPopup = CustomUI.actionButton('Logout', $scope);
      // if yes, then logout of the application
      confirmPopup.then(function (res) {
        if (res) {
          CustomUI.showSpinner($rootScope.platformID);
          if (Config.Session.profile.fb)
            Facebook.logout();
          AuthService.logout(LocalHTTP.userName()).then(function () {
            $state.go('login');
            CustomUI.hideSpinner();
          }).catch(function (err) {
            CustomUI.alert('Logout Failed');
            CustomUI.hideSpinner();
          });
        }
        if ($scope.popover)
          $scope.popover.hide();
      });
    };

    // load facebook profile
    function fbProfile() {
      if ($scope.fbAccount) {
        return {
          status: Config.Session.profile.fb.status
          // about: Config.Session.profile.fb.about,
          // likes: Config.Session.profile.fb.likes
        };
      } else return undefined;
    }

    ionicMaterialInk.displayEffect();
  });
