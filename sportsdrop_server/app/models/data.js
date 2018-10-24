var codes = require('../../config/status-codes');
var FullTextSearch = require('full-text-search-light');

var searchIndex = new FullTextSearch();
var cachedDB = null;

// filter function for search criteria
var filter = function (key, val) {
    if (key == 'type')
        return true;
    else
        return false;
};

// add to data to the index
addToDB = function (data) {
    searchIndex.add(data, filter);
    searchIndex.saveSync('searchIndex.json');
};

// remove from the database
removeDB = function (data) {
    searchIndex.remove();
};

// search database index
searchDB = function (text) {
    if (cachedDB === null)
        cachedDB = FullTextSearch.loadSync('searchIndex.json');
    var matches = cachedDB.search(text);
    return matches;
};

// json data formatter
formatJSON = function (data) {
    var jsonData = null;
    if (data.method === "POST")
        jsonData = data.body;
    else
        jsonData = JSON.parse(Object.keys(data.query));

    if (jsonData.game_players) {
        jsonData.game_players.accepted = jsonData.game_players.accepted.split(",");
        jsonData.game_players.pending = jsonData.game_players.pending.split(",");
        jsonData.game_players.rejected = jsonData.game_players.rejected.split(",");
        if (jsonData.game_players.accepted[0] === "")
            jsonData.game_players.accepted.splice(0, 1);
        if (jsonData.game_players.pending[0] === "")
            jsonData.game_players.pending.splice(0, 1);
        if (jsonData.game_players.rejected[0] === "")
            jsonData.game_players.rejected.splice(0, 1);
    } else if (jsonData.community || jsonData.community === "")
        jsonData.community = jsonData.community.split(",");
    return jsonData;
};

// extract the users header token
getToken = function (headers) {
    if (headers && headers.authorization) {
        var parted = headers.authorization.split(' ');
        if (parted.length === 2) {
            return parted[1];
        } else {
            return null;
        }
    } else {
        return null;
    }
};

// truncate game information for non-host users
initResultObj = function (id, tle, dt, addr, sport,
    isDel, sendr, join, accept, reject,
    cst, commnts) {
    return {
        _id: id,
        title: tle,
        date: dt,
        address: addr,
        type: sport,
        isDeleted: isDel,
        host: sendr,
        players: {
            pending: join,
            accepted: accept,
            rejected: reject
        },
        cost: cst,
        comments: commnts
    };
};

// retrieve the latest saved data session
loadSession = function (user, database) {
    var res = [],
        data = [],
        user_session,
        option = {};
    return new Promise(function (resolve, reject) {
        if (database.name.includes('games_database'))
            user_session = user.session.games;
        else if (database.name.includes('groups_database'))
            user_session = user.session.groups;
        if (user_session) {
            database.allDocs({
                keys: user_session,
                include_docs: true
            }).then(function (docs) {
                // bundle docs into sendable format
                if (database.name.includes('games_database')) {
                    data = docs.rows.map(function (row) {
                        if (!row.error)
                            return row.doc;
                    });
                    var length = data.length;
                    option.host = user.name;
                    // append certain info and omit others
                    data = reduceData(data, length, [], option);
                    data.forEach(function (entry) {
                        entry = restoreFields(entry);
                        res.push(entry);
                    });
                } else if (database.name.includes('groups_database')) {
                    for (var i = 0; i < docs.rows.length; i++) {
                        if (!docs.rows[i].error && docs.rows[i].doc)
                            data.push(docs.rows[i].doc);
                    }
                    res = data;
                }
                // successfully formatted
                return resolve(res);
            }).catch(function (err) {
                reject(err);
            });
        } else
            return resolve(null);
    });
};

// run the above function for each game
reduceData = function (data, len, res, param) {
    for (var i = 0; i < len; i++) {
        if (data[i] && (data[i].host !== param)) {
            var resultObj = initResultObj(data[i]._id,
                data[i].title,
                data[i].date,
                data[i].address,
                data[i].type,
                data[i].isDeleted,
                data[i].host,
                data[i].players.pending,
                data[i].players.accepted,
                data[i].players.rejected,
                data[i].cost,
                data[i].comments);
            // push the result and reset the snippet form
            res.push(resultObj);
        }
    }
    return res;
};

// request validation checker
requestValidated = function (request, result, secret, strategy) {
    var token = getToken(request.headers);
    var reqStatus = 0;
    var reqMsg = '';
    result.reqOK = false;
    return new Promise(function (resolve, reject) {
        var decoded = strategy.verify(token, secret);
        if (decoded) {
            var data = verifyData(formatJSON(request));
            if (data) {
                request.data = data;
                request.reqOK = true;
                return resolve(request);
            } else {
                request.reqStatus = codes.BADREQ;
                request.reqMsg = 'Invalid data structure';
                return reject(request);
            }
        } else {
            request.reqStatus = codes.UNAUTHORIZED;
            request.reqMsg = 'Invalid token provided';
            return reject(request);
        }
    });
};

// revert data keys back to original form
restoreFields = function (d) {
    var restored = {
        _id: d._id,
        game_title: d.title,
        game_activity: d.type,
        game_address: d.address,
        game_comments: d.comments,
        game_cost: d.cost,
        game_date: d.date,
        game_host: d.host,
        game_lat: d.lat,
        game_lng: d.lng,
        game_players: d.players,
    };
    if (d.hasOwnProperty('isEdited'))
        restored.game_status_edited = d.isEdited;
    if (d.hasOwnProperty('isDeleted'))
        restored.game_status_deleted = d.isDeleted;
    if (d.hasOwnProperty('isPosted'))
        restored.game_status_posted = d.isPosted;
    return restored;
};

// game data validation checker
verifyData = function (data) {
    var wrongKey = codes.NODATA;
    var rightKeys = function (d) {
        var keys = Object.keys(d);
        var regEx = /20[1-9]+-[0-9]+-[0-9]+T/;
        keys.forEach(function (key) {
            if (!regEx.test(key))
                wrongKey++;
        });
        if (wrongKey > codes.NODATA)
            return false;
        else
            return d;
    };
    var bastardize = function (d) {
        return {
            _id: d._id,
            title: d.game_title,
            type: d.game_activity,
            address: d.game_address,
            comments: d.game_comments,
            cost: d.game_cost,
            date: d.game_date,
            host: d.game_host,
            lat: d.game_lat,
            lng: d.game_lng,
            players: d.game_players,
            isEdited: d.game_status_edited,
            isPosted: d.game_status_posted,
            isDeleted: d.game_status_deleted,
        };
    };
    if ((data.game_status_posted === undefined) &&
        (data.game_status_edited === undefined) &&
        (data.game_status_deleted === undefined)) {
        var keyCheck = rightKeys(data);
        if (keyCheck)
            return keyCheck;
        else if (data.members)
            return data;
        else if (data.community && data.name)
            return data;
        else if (data.profile && data.profile.name)
            return data.profile;
        else
            return false;
    } else if (!data._id || !data.game_date)
        return false;
    else
        return bastardize(data);
};

// load user session data
sessionData = function (doc, db1, db2) {
    return loadSession(doc, db1).then(function (data) {
        if (!data) data = [];
        // append the games data to session object
        doc.session.games = data;
        return loadSession(doc, db2);
    }).then(function (data) {
        if (!data) data = [];
        // append the groups data to session object
        doc.session.groups = data;
        // append the users name
        doc.session.profile.name = doc.name;
        // append the users email address too
        doc.session.profile.email = doc.email;
        // finally, append profile picture
        if (doc._attachments)
            doc.session.profile.picture = doc._attachments['profile_pic.blob'].data;
        return doc;
    }).catch(function (err) {
        // handle error
        console.log(err);
        return err;
    });
};

module.exports = {
    filter: filter,
    addToDB: addToDB,
    removeDB: removeDB,
    searchDB: searchDB,
    getToken: getToken,
    initResultObj: initResultObj,
    loadSession: loadSession,
    sessionData: sessionData,
    reduceData: reduceData,
    requestValidated: requestValidated,
    restoreFields: restoreFields,
    verifyData: verifyData
};