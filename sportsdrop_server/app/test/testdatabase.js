// Requiring the package
var PouchDB = require('pouchdb');

// Creating the database object
var db = new PouchDB('http://node.couchdb.sd.admin:DB5lav3@127.0.0.1:9065/my_database');

// Database structure
var struct = {
    _design: {
        _id: '_design/index',
        views: {}
    },
    index: function (ddoc, name, mapFunction, empty) {
        if (empty) {
            ddoc = struct._design = {
                _id: '_design/index',
                views: {}
            }
        }
        ddoc.views[name] = {
            map: mapFunction.toString()
        };
        return ddoc
    },
    filter: function (name, fltrFunction) {
        var ddoc = {
            _id: "_design/" + name,
            filters: {}
        };
        ddoc.filters[name] = fltrFunction.toString();
        return ddoc
    },
    validation: function (name, validateFunction) {
        var ddoc = {
            _id: "_design/" + name,
            validate_doc_update: validateFunction.toString()
        };
        return ddoc
    }
};

// Create some local database documents
doc1 = {
    _id: '001',
    name: 'Ram',
    age: 23,
    Designation: 'Programmer'
}

// Create a search index for all games
var index = struct.index(struct._design, 'games', function (doc) {
    if (doc.address || doc.type) {
        emit(doc.date, doc._id);
    }
});

// Create document Index
index = struct.index(struct._design, 'invites', function (doc) {
    if (doc.address || doc.type) {
        emit(doc._id, [doc.address, doc.type]);
    }
});

// Create validation document
var validUser = struct.validation('validate', function (newDoc, oldDoc, userCtx) {
    if (newDoc._deleted === true) {
        // only allow admins to delete documents
        if (userCtx.roles.indexOf('_admin') !== -1)
            return;
        else
            throw ('FORBIDDEN');
    }
});

// Put validation user doc inside the database
db.put(validUser, function (err, response) {
    if (err) {
        // console.log(err);
        db.get(validUser._id).then(function (doc) {
            _rev = doc._rev;
            doc = index;
            doc._rev = _rev;
            db.put(doc).then(function (res) {
                console.log(res);
            });
        });
    } else {
        console.log(response);
    }
});

// Put index inside the database
db.put(index, function (err, response) {
    if (err) {
        // console.log(err);
        db.get(index._id).then(function (doc) {
            _rev = doc._rev;
            doc = index;
            doc._rev = _rev;
            db.put(doc).then(function (res) {
                console.log(res);
            });
        });
    } else {
        console.log(response);
    }
});