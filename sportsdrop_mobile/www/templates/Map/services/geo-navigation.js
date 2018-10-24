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
