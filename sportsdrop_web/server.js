//////////////////////////////////////////////////////////////////
//                                                              //
//  Author: Isaak Smart                                         //
//  Date: 02/12/2015                                            //
//                                                              //
//  Description: Sportsdrop Node.js Server Side Application.    //
//               This will service all of the main website.     //
//                                                              //
//////////////////////////////////////////////////////////////////

var os = require('os');
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');

var tcp = require('./config/tcp');
var Net = require('./config/netstat');

var app = express();
var Server = tcp.HTTP.server(app);

var port = process.env.PORT || Net.http.port;
var ipAddr = Net.http.dev;
var liveSite = false;
var www = '/www';

// switch between dev and live site
if (liveSite)
    route = '/main'
else route = '/404'

// get our request parameters
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

////////////////
/// WEBPAGES ///
////////////////

// serve main page
app.use('/', express.static(path.join(__dirname + www + route)));

// serve legal page
app.use('/legal', express.static(path.join(__dirname + www + '/legal')));

// serve licenses page
app.use('/licenses', express.static(path.join(__dirname + www + '/licenses')));

/////////////
/// PROXY ///
/////////////

// retrieve server information
app.get('/proxy', function (req, res) {
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
        };
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

// setup server access port
Server.listen(port, ipAddr, function () {
    console.log("Express Server Listening on PORT " + port);
});