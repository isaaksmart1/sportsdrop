var fs = require('fs');
var https = require('https');
var http = require('http');

HTTPS = {
    server: function (app) {
        var options = {
            key: fs.readFileSync('./app/ssl/key.pem'),
            cert: fs.readFileSync('./app/ssl/cert.pem')
        };
        return https.createServer(options, app);
    },
}

HTTP = {
    server: function (app) {
        return http.createServer(app);
    },
}

module.exports = {
    HTTP: HTTP,
    HTTPS: HTTPS
}