var PouchDB = require('pouchdb');
var Replicator = require('./replication');
var Net = require('../../config/netstat');

var _ip = Net.db.dev;
var _port = Net.db.port;

// create (secure) admin account
function createAdmin(name, passwd) {
    var cred = {};
    if (typeof name === 'string' && typeof passwd === 'string') {
        cred.user = name + ':';
        cred.pass = passwd + '@';
    } else {
        cred.user = '';
        cred.pass = '';
    }
    return cred;
}

// administrator privelages
var admin = createAdmin('', '');
var newUrl = function (url) {
    return "http://" + admin.user + admin.pass + _ip + ":" + _port + "/" + url;
};

// sportsdrop database structure
var struct = {
    _design: {
        _id: '_design/index',
        views: {}
    },
    activity: newUrl("games_database"),
    testdb: newUrl("testing_database"),
    users: newUrl("users_database"),
    feedback: newUrl("user_feedback"),
    groups: newUrl("groups_database"),
    clients: newUrl("socket_connections"),
    log: newUrl("_logs"),
    index: function (ddoc, name, mapFunction, empty) {
        if (empty) {
            ddoc = struct._design = {
                _id: '_design/index',
                views: {}
            };
        }
        ddoc.views[name] = {
            map: mapFunction.toString()
        };
        return ddoc;
    },
    filter: function (name, fltrFunction) {
        var ddoc = {
            _id: "_design/" + name,
            filters: {}
        };
        ddoc.filters[name] = fltrFunction.toString();
        return ddoc;
    },
    validation: function (name, validateFunction) {
        var ddoc = {
            _id: "_design/" + name,
            validate_doc_update: validateFunction.toString()
        };
        return ddoc;
    }
};

// setup a connection to local database
var activityDB = new PouchDB(struct.activity);
var testDB = new PouchDB(struct.testdb);

// create groups database
var groupDB = new PouchDB(struct.groups);

// setup a connection to user database
var userDB = new PouchDB(struct.users);

// setup connection to user feedback (no index required)
var feedDB = new PouchDB(struct.feedback);

// setup socket clients database
var socketDB = new PouchDB(struct.clients);

// setup logging database
var logDB = new PouchDB(struct.log);

// create a search index for all games
var activityIndex = struct.index(struct._design, 'games', function (doc) {
    if (doc.address || doc.type) {
        emit(doc.date, doc._id);
    }
});

// create a join index for all games
activityIndex = struct.index(struct._design, 'invites', function (doc) {
    if (doc.address || doc.type) {
        emit(doc._id, [doc.address, doc.type]);
    }
});

// create members index for each group (new design document)
var groupIndex = struct.index(struct._design, 'members', function (doc) {
    if (doc.members && (Object.prototype.toString.call(doc.members) === '[object Array]')) {
        emit(doc._id, doc.members);
    }
}, true);

// create user index
var userIndex = struct.index(struct._design, 'users', function (doc) {
    if (doc.session.profile && doc.session.profile.name && doc.session.profile.community)
        emit(doc.session.profile.name, doc.session.profile);
}, true);

// create filter function for changes
var filterIndex = struct.filter('filters', function (doc) {
    return [doc.members];
});

// create validation doc for non_admin users
var validUser = struct.validation('validate', function (newDoc, oldDoc, userCtx) {
    if (newDoc._deleted === true) {
        // only allow admins to delete documents
        if (userCtx.roles.indexOf('_admin') !== -1)
            return;
        else
            throw ('FORBIDDEN');
    }
});

// create validation doc for published groups
var validGroups = struct.validation('validate', function (newDoc, oldDoc, userCtx) {
    if (newDoc._deleted === true) {
        // only allow admins to delete documents
        if (userCtx.roles.indexOf('_admin') !== -1)
            return;
        else
            throw ('FORBIDDEN');
    }
});

// update database
function update(database, document, build) {
    database.get(document._id).then(function (doc) {
        var _rev = doc._rev;
        doc = document;
        doc._rev = _rev;
        database.put(doc).then(function (res) {
            console.log(res);
            console.log(database.__opts.name);
            // build the available document (index specific)
            if (build)
                build();
        }).catch(function (err) {
            console.log(err);
        });
    });
}

/////////////////////
// DATABASE INDEXS //
/////////////////////

// save a timestamp document on creation of each database
var tdoc = {
    _id: 'Sportsdrop - CouchDB (TM)',
    admin: 'node.couchdb.sd.admin',
    date: new Date(),
    synopsis: 'Backend datastore for application/json documents:\ntype: schema-less'
};

// save the user indexes
userDB.bulkDocs([validUser, userIndex, tdoc], function (err, res) {
    if (err) {
        return console.log(err);
    } else {
        console.log(res);
    }

    userDB.query('index/users', {
        // return immediately
        limit: 0
    }).then(function (res) {
        // index was built!
        console.log('user index built ' + res);
        // Replicator.run(struct.users, '_users');
    });

});

// save the activity indexes
activityDB.bulkDocs([validUser, activityIndex, tdoc], function (err, res) {
    if (err) {
        return console.log(err);
    } else {
        console.log(res);
    }

    activityDB.query('index/games', {
        // return immediately
        limit: 0
    }).then(function () {
        // kick off an initial build of 2nd index
        activityDB.query('index/invites', {
            // return immediately
            limit: 0
        });
    }).then(function (res) {
        // both indexes were built!
        console.log('activity index built ' + res);
        // Replicator.run(struct.activity, 'games_database');
    });

});

// save the groups indexes
groupDB.bulkDocs([validGroups, groupIndex, filterIndex, tdoc], function (err, res) {
    if (err) {
        return console.log(err);
    } else {
        console.log(res);
    }

    groupDB.query('index/members', {
        // return immediately
        limit: 0
    }).then(function (res) {
        // index was built!
        console.log('group index built ' + res);
        // Replicator.run(struct.groups, 'groups_database');
    });

    // then filter by members
    groupDB.changes({
        since: 'now',
        live: true,
        filter: 'filters',
        include_docs: true
    }).on('change', function (change) {
        // handle change
    }).on('complete', function (info) {
        // changes() was canceled
    }).on('error', function (err) {
        console.log(err);
    });

});

// save user feedback index
feedDB.bulkDocs([validUser, tdoc], function (err, res) {
    if (err) {
        return console.log(err);
    } else {
        console.log(res);
    }

    // Replicator.run(struct.feedback, 'user_feedback');
});

// save the activity index to test database
testDB.bulkDocs([activityIndex, tdoc], function (err, res) {
    if (err) {
        return console.log(err);
    } else {
        console.log(res);
    }

    testDB.query('index/games', {
        // return immediately
        limit: 0
    }).then(function () {
        // kick off an initial build of 2nd index
        testDB.query('index/invites', {
            // return immediately
            limit: 0
        });
    }).then(function (res) {
        // both indexes were built!
        console.log(res);
        // Replicator.run(struct.testdb, 'testing_database');
    });
    
});

// export connections to remote databases
module.exports = {
    activities: activityDB,
    groups: groupDB,
    users: userDB,
    feedback: feedDB,
    clients: socketDB,
    testing: testDB,
    logging: logDB
};