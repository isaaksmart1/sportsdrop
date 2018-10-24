var PouchDB = require('pouchdb');
var Net = require('../../../config/netstat');

const _ip = Net.db.prod;
const _port = Net.db.port;

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
};

var admin = createAdmin('node.couchdb.sd.admin', 'db5lav3');
var newUrl = function (url) {
    return "http://" + admin.user + admin.pass + _ip + ":" + _port + "/" + url;
};

// sportsdrop database structure
var struct = {
    _design: {
        _id: '_design/index',
        views: {}
    },
    url: newUrl("games_database"),
    testdb: newUrl("testing_database"),
    users: newUrl("_users"),
    feedback: newUrl("user_feedback"),
    groups: newUrl("groups_database"),
    clients: newUrl("socket_connections"),
    log: newUrl("_logs"),
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

// setup a connection to remote database
var activityDB = new PouchDB(struct.url);
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

/////////////////////
// DATABASE BUILDS //
/////////////////////

userDB.put(validUser).catch(function (err) {
    // catch error if index already exists
    if (err.name !== 'conflict') {
        console.log(err.name);
    }
});

activityDB.put(validUser).catch(function (err) {
    // catch error if index already exists
    if (err.name !== 'conflict') {
        console.log(err.name);
    }
});

feedDB.put(validUser).catch(function (err) {
    // catch error if index already exists
    if (err.name !== 'conflict') {
        console.log(err.name);
    }
});

groupDB.put(validGroups).catch(function (err) {
    // catch error if index already exists
    if (err.name !== 'conflict') {
        console.log(err.name);
    }
});

// save user index
userDB.put(userIndex).catch(function (err) {
    // catch error if index already exists
    if (err.name !== 'conflict') {
        console.log(err.name);
    }
}).then(function () {
    // kick off an initial build of 1st index
    return userDB.query('index/users', {
        // return immediately
        limit: 0
    });
}).catch(function (err) {
    console.log(err);
});

// save the secondary indexes
activityDB.put(activityIndex).catch(function (err) {
    // catch error if index already exists
    if (err.name !== 'conflict') {
        console.log(err.name);
    }
}).then(function () {
    // kick off an initial build of 1st index
    return activityDB.query('index/games', {
        // return immediately
        limit: 0
    });
}).then(function () {
    // kick off an initial build of 2nd index
    return activityDB.query('index/invites', {
        // return immediately
        limit: 0
    });
}).then(function (res) {
    // both indexes were built!
}).catch(function (err) {
    console.log(err);
});

// save the groups indexes
groupDB.put(groupIndex).catch(function (err) {
    // catch error if index already exists
    if (err.name !== 'conflict') {
        console.log(err.name);
    }
}).then(function () {
    // kick off an initial build of 1st index
    return groupDB.query('index/members', {
        // return immediately
        limit: 0
    });
}).then(function (res) {
    // both indexes were built!
}).catch(function (err) {
    console.log(err);
});

// also save the filter function 
groupDB.put(filterIndex).then(function () {
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
}).catch(function (err) {
    // catch error if index already exists
    if (err.name !== 'conflict') {
        console.log(err.name);
    }
});

// also save the index to test database
testDB.put(activityIndex).catch(function (err) {
    // catch error if index already exists
    if (err.name !== 'conflict') {
        console.log(err.name);
    }
}).then(function () {
    // kick off an initial build
    return testDB.query('index/games', {
        // return immediately
        limit: 0
    });
}).then(function () {
    // kick off an initial build of 2nd index
    return testDB.query('index/invites', {
        // return immediately
        limit: 0
    });
}).then(function (res) {
    // both indexes were built!
}).catch(function (err) {
    console.log(err);
});

module.exports = {
    activities: activityDB,
    groups: groupDB,
    users: userDB,
    feedback: feedDB,
    clients: socketDB,
    testing: testDB,
    logging: logDB
}
