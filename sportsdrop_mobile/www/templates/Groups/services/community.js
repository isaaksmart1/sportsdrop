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
