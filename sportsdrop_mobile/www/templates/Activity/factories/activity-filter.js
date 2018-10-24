angular.module('factory.activityfilter', [])

  .factory('ActivityFilter', function () {
    var searchObj = {};
    var repeatID;
    return {
      repeatSearch: repeatID,
      prevSearch: searchObj
    };
  });
