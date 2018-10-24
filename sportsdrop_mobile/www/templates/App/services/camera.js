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
