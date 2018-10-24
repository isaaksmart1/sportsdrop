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
