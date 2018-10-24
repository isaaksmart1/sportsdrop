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
