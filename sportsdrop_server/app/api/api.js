var jwt = require('jsonwebtoken');

var codes = require('../../config/status-codes');
var Auth = require('../../config/authorize');

var mail = require('../messaging/email');
var databases = require('../models/database');
var Data = require('../models/data');
var User = require('../models/user');

// establish a connection to game database
var activityDB = databases.activities;
var groupDB = databases.groups;
var testDB = databases.testing;
var feedbackDB = databases.feedback;

// establish a connection to user database
var authUsers = databases.users;

// activity functions
function search(obj) {
    var dt = obj[1];
        obj = obj[0];

    return new Promise(function (resolve, reject) {
        var gameType = null,
            queryResult = [],
            results = {
                data: [],
                status: null
            };

        // format incoming data
        var _startAddr = obj.address.toLowerCase();
        var _endAddr = obj.address.toLowerCase();
        var _startType = obj.type.toLowerCase();
        var _endType = obj.type.toLowerCase();

        // widen search criteria any sport
        if (obj.type == '') {
            _startType = '\ufff0';
            _endType = '';
        }
        // widen search for any location (beta only)
        if (obj.address == '') {
            _startAddr = '\ufff0';
            _endAddr = '';
        }

        // search games matching key
        activityDB.query('index/games', {
            startkey: obj.date,
            endkey: dt,
            include_docs: true,
            descending: true,
            limit: obj.limit || 10
        }).then(function (result) {
            queryResult = result.rows.map(function (row) {
                return row.doc;
            });
            if (queryResult.length > 0) {
                obj.type.split(',').forEach(function (type) {
                    var res = Data.searchDB(type);
                    res.forEach(function (d) {
                        d = Data.restoreFields(d);
                        results.data.push(d);
                    });
                });
            }
            return resolve({
                data: results.data,
                status: codes.DATAOK
            });
        }).catch(function (err) {
            return reject({
                status: codes.NODATA
            });
        });
    });
}

function remove(obj) {
    return new Promise(function (resolve, reject) {
        if (obj.isPosted) {
            activityDB.get(obj._id).then(function (doc) {
                if (doc.host == obj.host)
                    return activityDB.remove(doc);
            }).then(function (result) {
                return resolve({
                    status: codes.DATAOK,
                    data: JSON.stringify(result)
                });
            }).catch(function (err) {
                return reject({
                    status: codes.NODATA
                });
            });
        }
    });
}

function join(obj) {
    return new Promise(function (resolve, reject) {
        activityDB.query('index/invites', {
            keys: Object.keys(obj),
            include_docs: true,
            descending: true
        }).then(function (result) {
            var queryResult = result.rows;
            var length = queryResult.length;
            var val;
            if (length > 0) {
                for (i = 0; i < length; i++) {
                    val = obj[Object.keys(obj)[i]];
                    queryResult[i].doc.players.pending.push(val);
                    queryResult[i]._id = queryResult[i].id;
                    queryResult[i] = queryResult[i].doc;
                    delete queryResult[i].id;
                }
                return activityDB.bulkDocs(queryResult);
            }
        }).then(function (result) {
            return resolve({
                data: result,
                status: codes.DATAOK
            });
        }).catch(function () {
            // handle any errors
            return reject({
                status: codes.NODATA
            });
        });
    });
}

function activity(obj) {
    var req = obj;
        obj = obj.data;
    return new Promise(function (resolve, reject) {
        var new_obj = [];

        // store the user who has requested the information
        var enquirer = req.user.split(':')[1];

        // scan database and return latest update
        activityDB.get(obj._id, {
            include_docs: true
        }).then(function (result) {
            // game still exists
            new_obj[0] = result;
            // for games requested by other users
            if (new_obj[0].host != enquirer) {
                new_obj = Data.reduceData(new_obj, 1, [], enquirer);
            } else {
                // for games requested by host
                new_obj[0].isPosted = true;
                new_obj[0]._rev = obj._rev;
            }
            new_obj[0] = Data.restoreFields(new_obj[0]);
            return resolve({
                status: codes.DATAOK,
                data: JSON.stringify(new_obj[0])
            });
        }).catch(function (err) {
            // game no longer exists
            return reject({
                status: codes.NODATA,
                data: JSON.stringify(true)
            });
        });
    });
}

function community(obj) {
    return new Promise(function (resolve, reject) {
        var thisUser = obj.name;
        var community = [];

        // retrieve list of users from the community
        authUsers.query('index/users', {
            keys: obj.community,
            include_docs: true,
            attachments: true
        }).then(function (result) {
            // return the members that belong to this user's community
            community = result.rows.map(function (row) {
                if (row && row.doc._attachments)
                    row.value.picture = row.doc._attachments['profile_pic.blob'].data;
                return row.value;
            });
            // send community list to user
            return resolve({
                data: community,
                status: codes.DATAOK
            });
        }).catch(function (err) {
            // handle any errors
            return reject({
                status: err
            });
        });
    });
}

function leave(obj) {
    var req = obj;
        obj = obj.data;
    return new Promise(function (resolve, reject) {

        // store the user who has requested the information
        var enquirer = req.user.split(':')[1];

        // leave games matching key
        activityDB.query('index/invites', {
            key: obj._id,
            include_docs: true,
            descending: true
        }).then(function (result) {
            var i;
            var queryResult = result.rows[0].doc;
            var filterResult = queryResult;
            if (queryResult != undefined) {
                var joinList = queryResult.players.pending;
                var accList = queryResult.players.accepted;
                // remove player from join list
                for (i = joinList.length - 1; i >= 0; i--)
                    if (joinList[i] == enquirer)
                        joinList.splice(i, 1);
                // remove player from accept list
                for (i = accList.length - 1; i >= 0; i--)
                    if (accList[i] == enquirer)
                        accList.splice(i, 1);
                filterResult.players.pending = joinList;
                filterResult.players.accepted = accList;
            }
            return activityDB.put(filterResult);
        }).then(function (result) {
            return resolve({
                status: codes.DATAOK
            });
        }).catch(function () {
            // handle any errors
            return reject({
                status: codes.NODATA
            });
        });
    });
}

function invite(obj) {
    return new Promise(function (resolve, reject) {
        // update backend database with changes
        activityDB.get(obj._id, {
            include_docs: true
        }).then(function (result) {
            // perform update to previous game version
            var preUpdate = result;
            if (preUpdate != undefined) {
                preUpdate.players.pending = obj.players.pending;
                preUpdate.players.accepted = obj.players.accepted;
                preUpdate.players.rejected = obj.players.rejected;
                // overwrite game in couchdb
                return activityDB.put(preUpdate);
            }
        }).then(function (result) {
            // successfully updated, notify client
            return resolve({
                status: codes.DATAOK
            });
        }).catch(function (err) {
            // handle any errors(should never be reached)
            return reject({
                status: codes.NODATA
            });
        });
    });
}

function create(obj) {
    return new Promise(function (resolve, reject) {
        // flag for subsequent updates
        if (obj.isEdited == true) {
            activityDB.get(obj._id).then(function (result) {
                result.address = obj.address;
                result.comments = obj.comments;
                result.cost = obj.cost;
                result.date = obj.date;
                result.type = obj.type;
                result.lat = obj.lat;
                result.lng = obj.lng;
                return result;
            }).then(function (result) {
                activityDB.put(result);
                Data.addToDB(result);
                result = Data.restoreFields(result);
                return resolve({
                    status: codes.DATAOK,
                    data: JSON.stringify(result)
                });
            }).catch(function (err) {
		activityDB.put(obj).then(function () {
                    Data.addToDB(obj);
                    var result = Data.restoreFields(obj);
                    return resolve({
                        status: codes.DATAOK,
                        data: JSON.stringify(result)
                    });
                }).catch(function (err) {
                    return reject({
                        status: codes.NODATA
                    });
                });
            });
        } else {
            activityDB.put(obj).then(function () {
                Data.addToDB(obj);
                var result = Data.restoreFields(obj);
                return resolve({
                    status: codes.DATAOK,
                    data: JSON.stringify(result)
                });
            }).catch(function (err) {
                return reject({
                    status: codes.NODATA
                });
            });
        }
    });
}

function group(obj) {
    return new Promise(function (resolve, reject) {
        groupDB.get(obj._id).then(function (res) {
            obj._rev = res._rev;
            res = obj;
            if (obj.members.length === 0)
                return groupDB.remove(obj);
            else
                return groupDB.put(obj, obj._rev);
        }).then(function (result) {
            return resolve({
                status: result.status
            });
        }).catch(function (err) {
            // handle error
            return groupDB.put(obj);
        }).then(function () {
            return resolve({
                status: true
            });
        }).catch(function () {
            return reject({
                status: false
            });
        });
    });
}

function profile(obj) {
    return new Promise(function (resolve, reject) {
        var thisUser = 'org.couchdb.user:' + obj.name;
        var buffer = new Buffer(obj.picture, 'base64');
        authUsers.get(thisUser).then(function (user) {
            user._attachments = {
                'profile_pic.blob': {
                    content_type: 'image/jpeg',
                    data: buffer
                }
            };
            return authUsers.put(user, user._rev);
        }).then(function (result) {
            return resolve({
                status: result.ok
            });
        }).catch(function (err) {
            // handle error
            return reject({
                status: err
            });
        });
    });
}

function feedback(obj) {
    return new Promise(function (resolve, reject) {
        feedbackDB.post(obj).then(function () {
            return resolve({
                data: 'We will be in touch shortly'
            });
        }).catch(function () {
            return reject({
                data: 'Unable to send feedback. Please try again later.'
            });
        });
    });
}

// user authentication functions

function account(user) {
    return new Promise(function (resolve, reject) {
        var thisUser = new User(user.name, user.email);
        authUsers.get(thisUser._id).then(function (doc) {
            doc.login_status = false;
            return authUsers.remove(doc);
        }).then(function (result) {
            return resolve({
                status: result.ok
            });
        }).catch(function (err) {
            // handle error
            return reject({
                status: err
            });
        });
    });
}

function login(user) {
    return new Promise(function (resolve, reject) {
        if (user.name && user.password) {
            var thisUser = new User(user.name);
            authUsers.get(thisUser._id, {
                attachments: true
            }).then(function (doc) {
                // hold user information inside temporary model
                thisUser = new User(doc.name, doc.email, doc.pass, doc.login_status);
                // check if there is an active login session
                if (doc.login_status === 'connected') {
                    return reject({
                        status: false,
                        data: 'You are currently logged in using another device.'
                    });
                }
                // check if password matches
                thisUser.comparePassword(user.password, function (err, isMatch) {
                    if (isMatch && !err) {
                        // set a new active session
                        doc.login_status = 'connected';
                        // set expiration date of user token
                        doc.expires = codes.SESSION_EXPIRE_TIME();
                        authUsers.put(doc, doc._rev);
                        // if user is found and password is right create a token
                        var payload = {
                            expires: doc.expires,
                            name: doc.name,
                            role: doc.type
                        };
                        var token = jwt.sign(payload, Auth.secret);
                        // check if previous session data exists, if so retrieve it
                        if (doc.session) {
                            Data.sessionData(doc, activityDB, groupDB).then(function (doc) {
                                // return the token plus data as JSON
                                return resolve({
                                    status: true,
                                    data: 'JWT ' + token,
                                    session: doc.session
                                });
                            }).catch(function (err) {
                                // handle errors
                            });
                        } else {
                            // return the information including token as JSON
                            return resolve({
                                status: true,
                                data: 'JWT ' + token
                            });
                        }
                    } else {
                        return reject({
                            status: false,
                            data: ''
                        });
                    }
                });
            }).catch(function (err) {
                return reject({
                    status: false,
                    data: ''
                });
            });
        } else if (user.fb) {
            fbLogin(user);
        } else {
            return reject({
                status: false,
                data: 'Invalid Email or Password.'
            });
        }
    });
}

function fbLogin(user) {
    return new Promise(function (resolve, reject) {
        var fb = user.fb;
        // fb.access_token = 'invalidtokeninfactitsamaliciousvirus';
        FB.verifyToken(fb.access_token, function (xhr) {
            xhr.setEncoding('utf8');
            xhr.on('data', function (token) {
                token = JSON.parse(token);
                if (token.data && token.data.is_valid) {
                    var data = token.data;
                    var fbUser = new User(fb.name);
                    // create facebook user object
                    fbUser.session.profile.fb = fb;
                    fbUser.expires = data.expires_at; // fb.expires
                    fbUser.login_status = fb.status;
                    // create request token for facebook users
                    var payload = {
                        expires: fbUser.expires,
                        name: fbUser.name,
                        id: fb.id
                    };
                    token = jwt.sign(payload, Auth.secret);
                    // save user login details
                    authUsers.get(fbUser._id, {
                        attachments: true
                    }, function (err, doc) {
                        if (err) {
                            authUsers.put(fbUser);
                            // return the information including token as JSON
                            return resolve({
                                status: true,
                                data: 'JWT ' + token
                            });
                        } else {
                            doc.session.profile.fb = fb;
                            doc.expires = fbUser.expires;
                            doc.login_status = fb.login_status;
                            authUsers.put(doc, doc._rev);
                            Data.sessionData(doc, activityDB, groupDB).then(function (doc) {
                                // set fb picture as profile picture
                                if (doc.session.profile.fb.picture)
                                    doc.session.profile.picture = doc.session.profile.fb.picture.data.url;
                                // return the token plus data as JSON
                                return resolve({
                                    status: true,
                                    data: 'JWT ' + token,
                                    session: doc.session
                                });
                            }).catch(function (err) {
                                return reject({
                                    status: err
                                });
                            });
                        }
                    });
                } else {
                    return reject({
                        status: token.error
                    });
                }
            });
            xhr.on('error', function (err) {
                return reject({
                    status: err
                });
            });
            xhr.on('end', function (res) {});
        });
    });
}

function logout(user) {
    return new Promise(function (resolve, reject) {
        var thisUser = new User(user.name);
        authUsers.get(thisUser._id, {
            attachments: true
        }).then(function (userData) {
            userData.login_status = false;
            userData.session = user.data;
            if (userData.session.profile.picture) {
                var buffer = new Buffer(userData.session.profile.picture, 'base64');
                userData._attachments = {
                    'profile_pic.blob': {
                        content_type: 'image/jpeg',
                        data: buffer
                    }
                };
                delete userData.session.profile.picture;
            }
            if (userData.session._attachments)
                delete userData.session._attachments;
            return authUsers.put(userData, userData._rev);
        }).then(function (result) {
            return resolve({
                status: result.ok
            });
        }).catch(function (err) {
            return reject({
                status: err
            });
        });
    });
}

function signup(user) {
    var req = user;
        user = req.body;
    return new Promise(function (resolve, reject) {
        if (!user.email || !user.password) {
            return reject({
                status: false,
                data: 'Invalid Name or Password.'
            });
        } else {
            var newUser = new User(user.name, user.email, user.password);
            authUsers.get(newUser._id).then(function () {
                return reject({
                    status: false,
                    data: 'Username already exists.'
                });
            }, function (err) {
                throw err;
            }).catch(function (err) {
                if (err.status == 404) {
                    mail.newUser(req, newUser, function (err) {
                        if (err) {
                            return reject({
                                status: false,
                                data: 'Invalid Email address'
                            });
                        } else {
                            return resolve({
                                status: true,
                                data: 'Please check your Inbox'
                            });
                        }
                    });
                } else {
                    return reject({
                        status: false,
                        data: 'Service temporarily unavailable'
                    });
                }
            });
        }
    });
}

function verify(user) {
    mail.verifyUser(user[0], user[1], authUsers);
}

function userSession(user) {
    return new Promise(function (resolve, reject) {
        var timeNow = Math.round(new Date().getTime() / 1000);
        // verify the existing token

        var profile = jwt.verify(Data.getToken(user.headers), Auth.secret);
        // check if token has expired 3 hours past issue date

        if (timeNow - profile.expires > 0) {
            return reject({
                status: codes.UNAUTHENTICATED
            });
        } else {
            return resolve({
                status: true
            });
        }
    });
}

function forgotpassword(user) {
    return mail.resendPassword(user, authUsers);
}

function execute(params, func) {
    switch (func) {
        case 'forgotpassword':
            return forgotpassword(params);
        case 'activity':
            return activity(params);
        case 'search':
            return search(params);
        case 'invite':
            return invite(params);
        case 'community':
            return community(params);
        case 'join':
            return join(params);
        case 'leave':
            return leave(params);
        case 'remove':
            return remove(params);
        case 'account':
            return account(params);
        case 'profile':
            return profile(params);
        case 'group':
            return group(params);
        case 'create':
            return create(params);
        case 'feedback':
            return feedback(params);
        case 'login':
            return login(params);
        case 'logout':
            return logout(params);
        case 'signup':
            return signup(params);
        case 'verify':
            return verify(params);
        case 'userSession':
            return userSession(params);
        default:
            break;
    }
}

module.exports = {
    auth: function (obj, callback) {
        return execute(obj, callback);
    },
    get: function (obj, callback) {
        return execute(obj, callback);
    },
    post: function (obj, callback) {
        return execute(obj, callback);
    },
    remove: function (obj, callback) {
        return execute(obj, callback);
    },
};