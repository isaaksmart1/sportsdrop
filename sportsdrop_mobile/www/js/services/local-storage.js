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
