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
