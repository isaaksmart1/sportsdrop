'strict'

var https = require('https');

const app_secret = 'bb285cb65be22ee89175e531029dff34';
const app_id = '419650108398981';
const metadata =
    'key=value' +
    '&amp' +
    // 'client_id=' + app_id +
    // '&client_secret=' + app_secret +
    ';access_token=' + app_id + '|' + app_secret +
    // '&grant_type=client_credentials' +
    '&redirect_uri=http://localhost:5000' +
    // '&code='
    // v2.8/oauth/
    '';

// set up a facebook graph API request model
function graphAPI(method, path, options) {
    query = encodeQuery(options);
    this.method = method || 'GET';
    this.host = 'graph.facebook.com';
    this.port = process.env.PORT || 443;
    this.path = '/' + path + '?' + query + metadata;
};

// parse url request string
function parseQuery(obj) {};

// create url request string
function encodeQuery(obj) {
    var query = [];
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            query.push(i + '=' + obj[i]);
        }
    };
    query = query.join('&');
    if (query) query += '&';
    return query;
};

// run HTTPS request
function async(request, cb) {
    var req = https.request(request, cb);
    req.on('error', function (err) {
        // handle errors
    });
    req.end();
};

module.exports = {
    verifyToken: function (token, callback) {
        var req = new graphAPI('GET', 'debug_token', {
            input_token: token,
            access_token: token
        });
        async(req, callback);
    },
    async: async,
    graphAPI: graphAPI
}