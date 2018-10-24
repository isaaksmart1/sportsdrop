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
