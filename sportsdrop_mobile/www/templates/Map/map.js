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
