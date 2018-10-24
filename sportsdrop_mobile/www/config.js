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
