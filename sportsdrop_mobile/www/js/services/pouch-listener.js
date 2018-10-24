angular.module('service.pouchdb', [])

  .service('PouchDBListener', function ($rootScope) {

    // hold local database information of games here 
    var newList = [];

    // inital fetch of data from local database
    function fetchInitialDocs(database, renderView, options) {
      return database.allDocs({
        include_docs: true
      }).then(function (res) {
        newList = res.rows.map(function (row) {
          return row.doc;
        });
        renderView(newList, options);
      });
    }

    // react to only the data which has changed
    function reactToChanges(database, renderView, options) {
      database.changes({
        live: true,
        since: 'now',
        include_docs: true
      }).on('change', function (change) {
        var changes = [];
        if (change.deleted) {
          // change.id holds the deleted id
          onDeleted(change.id);
        } else { // updated/inserted
          // change.doc holds the new doc
          changes[0] = change.doc;
          onUpdatedOrInserted(changes[0]);
        }
        renderView(newList, options);
      }).on('error', console.log.bind(console));
    }

    // maintain order of games by date
    function binarySearch(arr, docId) {
      var low = 0,
        high = arr.length,
        mid;
      while (low < high) {
        mid = (low + high) >>> 1; // faster version of Math.floor((low + high) / 2)
        if (arr[mid]._id < docId)
          low = mid + 1;
        else high = mid;
      }
      return low;
    }

    // update UI when a game is deleted
    function onDeleted(id) {
      var index = binarySearch(newList, id);
      var doc = newList[index];
      if (doc && doc._id === id) {
        newList.splice(index, 1);
      }
    }

    // update UI when a game is updated/inserted
    function onUpdatedOrInserted(newDoc) {
      var index = binarySearch(newList, newDoc._id);
      var doc = newList[index];
      if (doc && doc._id === newDoc._id) { // update
        newList[index] = newDoc;
      } else { // insert
        newList.splice(index, 0, newDoc);
      }
    }

    // synchronise local database <=> UI
    function init(database, next, opt) {
      fetchInitialDocs(database, next, opt).then(reactToChanges(database, next, opt)).catch(console.log.bind(console));
      database.setMaxListeners(0);
    }

    return {
      listen: init
    };
  });
