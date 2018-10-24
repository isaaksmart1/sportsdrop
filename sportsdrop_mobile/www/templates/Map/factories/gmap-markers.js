angular.module('factory.gmapmarkers', [])

  .factory('Markers', function ($q) {
    return {
      getMarkers: function () {
        return $q(function (resolve, reject) {
          activityDB.allDocs({
            include_docs: true
          }).then(function (result) {
            var length = result.rows.length;
            var markers = [];
            for (i = 0; i < length; i++)
              markers[i] = result.rows[i].doc;
            return resolve(markers);
          });
        });
      }
    };
  });
