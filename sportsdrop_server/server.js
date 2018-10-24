//////////////////////////////////////////////////////////////////
//                                                              //
//  Author: Isaak Smart                                         //
//  Date: 02/12/2015                                            //
//                                                              //
//  Description: Sportsdrop Node.js Server Side Application.    //
//               This will service all of the games posted      //
//               and searched through node js server            //
//               and the NoSQL CouchDB database.                //
//                                                              //
//////////////////////////////////////////////////////////////////

require('./app/api/globals');
debugMode = true;

var os = require('os');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');

var tcp = require('./config/tcp');
var Auth = require('./config/authorize');
var Net = require('./config/netstat');

var app = express();
var Server = tcp.HTTP.server(app);

var SDM = require('./app/messaging/sockets').listen(Server);
var Data = require('./app/models/data');
var API = require('./app/api/api');

var port = process.env.PORT || Net.ip.port;
var ipAddr = Net.ip.dev;

// use the passport package in our application
Auth.run();

// get our request parameters
app.use(Auth.initialize());
app.use(bodyParser.urlencoded({
    extended: true,
    limit: '1000mb'
}));
app.use(bodyParser.json({
    limit: '1000mb'
}));

// allow cross origin resource sharing
app.use(function (req, res, next) {
    var origin = req.headers.origin;
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers",
        "Origin, Authorization, X-Requested-With, Content-Type, Accept");
    next();
});

/////////////
/// PROXY ///
/////////////

app.use('/', express.static(path.join(__dirname, 'assets')));

// retrieve server information
app.get("/proxy", function (req, res) {
    if (Object.keys(req.query)[0] !== "password") {
        res.writeHeader(404, {
            "Content-Type": "text/html"
        });
        res.write("<html lang='en'><head><meta charset='utf-8'><title>Error</title></head><body><pre>Cannot GET /proxy</pre></body></html>");
        res.end();
    } else {
        var interfaces = os.networkInterfaces();
        var addresses = [];
        for (var k in interfaces) {
            for (var k2 in interfaces[k]) {
                var address = interfaces[k][k2];
                if (address.family === 'IPv4' && !address.internal) {
                    addresses.push(address.address);
                }
            }
        }
        var IP = (req.headers['x-forwarded-for'] || req.connection.remoteAddress).split(',');
        IP[1] = addresses[0];
        res.send({
            Server_IP: IP[1],
            Proxy_IP: req.headers.host,
            X_Forwarded_For: IP[0]
        });
        res.end();
    }
});

////////////////
/// READ API ///
////////////////

// query game from couchdb
app.get("/sportsdrop/findgame", Auth.authenticate(), function (req, res) {
    Data.requestValidated(req, res, Auth.secret, jwt).then(function (req) {
        var dt = new Date();
        var queryObj = req.data;

        // format to account for DayLight Saving
        dt = dt.setHours(dt.getHours() - dt.getTimezoneOffset() / 60);
        dt = new Date(dt);
        dt = dt.toJSON();

        API.get([queryObj, dt], 'search').then(function (result) {
            if (result.data) {
                return res.send({
                    status: result.status,
                    data: result.data
                });
            } else {
                return res.send({
                    status: result.status
                });
            }
        }).catch(function (err) {
            return res.send({
                status: err.status
            });
        });

    }).catch(function (err) {
        res.status(err.reqStatus).send({});
    });
});

// delete game from couchdb
app.get("/sportsdrop/deletegame", Auth.authenticate(), function (req, res) {
    Data.requestValidated(req, res, Auth.secret, jwt).then(function (req) {
        var deleteObj = req.data;

        // delete game from backend database
        API.remove(deleteObj, 'remove').then(function (result) {
            return res.send({
                status: result.DATAOK,
                data: JSON.stringify(result)
            });
        }).catch(function (err) {
            return res.send({
                status: err.status
            });
        });

    }).catch(function (err) {
        res.status(err.reqStatus).send({});
    });
});

// join active games from couchdb
app.get("/sportsdrop/joingame", Auth.authenticate(), function (req, res) {
    Data.requestValidated(req, res, Auth.secret, jwt).then(function (req) {
        var joinObj = req.data;

        // join games matching key
        API.get(joinObj, 'join').then(function (result) {
            return res.send({
                status: result.status
            });
        }).catch(function (err) {
            return res.send({
                status: err.status
            });
        });

    }).catch(function (err) {
        res.status(err.reqStatus).send({});
    });
});

// scan couchdb for updates
app.get("/sportsdrop/gameinfo", Auth.authenticate(), function (req, res) {
    Data.requestValidated(req, res, Auth.secret, jwt).then(function (req) {
        var scanOld = req;

        API.get(scanOld, 'activity').then(function (result) {
            return res.send({
                status: result.status,
                data: result.data
            });
        }).catch(function (err) {
            return res.send({
                status: err.status,
                data: err.data
            });
        });

    }).catch(function (err) {
        res.status(err.reqStatus).send({});
    });
});

// retrieve list of members from the community
app.get("/sportsdrop/community", Auth.authenticate(), function (req, res) {
    Data.requestValidated(req, res, Auth.secret, jwt).then(function (req) {
        var namesObj = req.data;

        API.get(namesObj, 'community').then(function (result) {
            return res.send({
                status: result.status,
                data: result.data
            });
        }).catch(function (err) {
            return res.send({
                status: err.status
            });
        });

    }).catch(function (err) {
        res.status(err.reqStatus).send({});
    });
});

/////////////////
/// WRITE API ///
/////////////////

// leave active games from couchdb
app.post("/sportsdrop/leavegame", Auth.authenticate(), function (req, res) {
    Data.requestValidated(req, res, Auth.secret, jwt).then(function (req) {
        var leaveObj = req;

        API.post(leaveObj, 'leave').then(function (result) {
            return res.send({
                status: result.status
            });
        }).catch(function (err) {
            return res.send({
                status: err.status
            });
        });

    }).catch(function (err) {
        res.status(err.reqStatus).send({});
    });
});

// update player requests to couchdb
app.post("/sportsdrop/updateinvites", Auth.authenticate(), function (req, res) {
    Data.requestValidated(req, res, Auth.secret, jwt).then(function (req) {
        var newUpdate = req.data;

        API.post(newUpdate, 'invite').then(function (result) {
            return res.send({
                status: result.status
            });
        }).catch(function (err) {
            return res.send({
                status: err.status
            });
        });

    }).catch(function (err) {
        res.status(err.reqStatus).send({});
    });
});

// save game to couchdb
app.post("/sportsdrop/savegame", Auth.authenticate(), function (req, res) {
    Data.requestValidated(req, res, Auth.secret, jwt).then(function (req) {
        var postObj = req.data;

        API.post(postObj, 'create').then(function (result) {
            return res.send({
                status: result.status,
                data: result.data
            });
        }).catch(function (err) {
            return res.send({
                status: err.status
            });
        });

    }).catch(function (err) {
        res.status(err.reqStatus).send({});
    });
});

// add, modify or delete user groups
app.post("/sportsdrop/groups", Auth.authenticate(), function (req, res) {
    Data.requestValidated(req, res, Auth.secret, jwt).then(function (req) {
        var groupReq = req.data;

        API.post(groupReq, 'group').then(function (result) {
            return res.send({
                status: result.status
            });
        }).catch(function (err) {
            return res.send({
                status: err.status
            });
        });

    }).catch(function (err) {
        res.status(err.reqStatus).send({});
    });
});

// update profile information
app.post("/sportsdrop/profile", Auth.authenticate(), function (req, res) {
    Data.requestValidated(req, res, Auth.secret, jwt).then(function (req) {
        var profileInfo = req.data;

        API.post(profileInfo, 'profile').then(function (result) {
            return res.send({
                status: result.status
            });
        }).catch(function (err) {
            return res.send({
                status: err.status
            });
        });

    }).catch(function (err) {
        res.status(err.reqStatus).send({});
    });
});

// submit user feedback to application author(s)
app.post("/sportsdrop/feedback", Auth.authenticate(), function (req, res) {
    var feedObj = req.body;

    API.post(feedObj, 'feedback').then(function (result) {
        return res.send({
            data: result.data
        });
    }).catch(function (err) {
        return res.send({
            data: err.data
        });
    });

});

// delete a user account
app.post("/sportsdrop/deleteaccount", function (req, res) {
    API.remove(req.body, 'account').then(function (result) {
        return res.send({
            status: result.status
        });
    }).catch(function (err) {
        return res.send({
            status: err.status
        });
    });

});

//////////////////////////
/// AUTHENTICATION API ///
//////////////////////////

// handle and authenticate existing user
app.post("/sportsdrop/login", function (req, res) {
    API.auth(req.body, 'login').then(function (result) {
        return res.send({
            success: result.status,
            token: result.data,
            session: result.session
        });
    }).catch(function (err) {
        return res.send({
            success: err.status,
            data: err.data
        });
    });
});

// handle user logout and session de-activations
app.post("/sportsdrop/logout", Auth.authenticate(), function (req, res) {
    API.auth(req.body, 'logout').then(function (result) {
        return res.send({
            success: result.status
        });
    }).catch(function (err) {
        return res.send({
            status: err.status
        });
    });
});

// create a new user account
app.post("/sportsdrop/signup", function (req, res) {
    API.auth(req, 'signup').then(function (result) {
        return res.send({
            success: result.status,
            data: result.data
        });
    }).catch(function (err) {
        return res.send({
            success: err.status,
            data: err.data
        });
    });
});

// verify user email addresses when signing up
app.get("/sportsdrop/verify", function (req, res) {
    API.auth([req, res], 'verify');
});

// handle post request for users forgotten password
app.post("/sportsdrop/forgotpassword", function (req, res) {
    API.auth(req.body, 'forgotpassword').then(function (result) {
        return res.send({
            success: true,
            data: result
        });
    }).catch(function (err) {
        return res.send({
            success: false,
            data: err
        });
    });
});

// poll user session expiration
app.get("/sportsdrop/sessiontimeout", Auth.authenticate(), function (req, res) {
    var thisUser = req;
    API.auth(thisUser, 'userSession').then(function (result) {
        return res.send({
            success: result.status
        });
    }).catch(function (err) {
        return res.status(err.status).send({});
    });
});

// setup server access port
Server.listen(port, ipAddr, function () {
    console.log("Express Server Listening on PORT " + port);
});

// NOTE:
// GET
//	- data exists inside the req.query field
// POST
//	- data exists inside the req.body field