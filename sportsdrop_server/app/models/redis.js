var redis = require('redis');
var Net = require('../../config/netstat');

const _ip = Net.redis.prod;
const _port = Net.redis.port;
const _url = Net.redis.url;
const _pass = Net.redis.pass;

client = redis.createClient({
     host: _ip,
     port: _port,
     password: _pass,
     retry_strategy: function (options) {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            // End reconnecting on a specific error and flush all commands with
            // a individual error
            // return new Error('The server refused the connection');
            return console.error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            // End reconnecting after a specific timeout and flush all commands
            // with a individual error
            // return new Error('Retry time exhausted');
            return console.error('Retry time exhausted');
        }
        if (options.attempt > 10) {
            // End reconnecting with built in error
            return undefined;
        }
        // reconnect after
        return Math.min(options.attempt * 100, 3000);
    }
});

client.on("connect", function () {
    console.log("Redis client connected to redis server at address: " + client.address);
});

client.on("error", function (err) {
    console.error("Error " + err instanceof Error);
    console.error("Abort " + err instanceof redis.AbortError);
    console.error("Aggregate " + err instanceof redis.AggregateError);
});

del = function (userID) {
    client.EXISTS(userID, function (err, res) {

        if (err)
            return console.error("Error " + err)

        client.DEL(userID, function (err, res) {
            if (err)
                return console.error("Error " + err)
            // console.log("Data deleted " + userID);
        });

    });
};

get = function (userID) {
    return new Promise(function (resolve, reject) {

        var userData = null;
        client.EXISTS(userID, function (err, res) {

            if (err)
                return reject(console.error("Error " + err))

            client.HGETALL(userID, function (err, res) {
                // console.log("Data " + res);
                userData = res;
                return resolve(userData)
            });

        });
    });
};

save = function (userID, userData, ttlExpire = undefined) {

    if (ttlExpire === undefined || ttlExpire < 0)
        ttlExpire = 100

    client.EXISTS(userID, function (err, res) {

        if (err)
            return console.error("Error " + err)

        client.HMSET(userID, userData, function (err, res) {
            if (err)
                return console.error("Error " + err)
            // console.log("Data " + userID);
            client.EXPIRE(userID, ttlExpire, function (err, res) {
                if (err)
                    return console.error("Error " + err)
                // console.log("Expiration " + res);
                client.TTL(userID, function (err, res) {
                    if (err)
                        return console.error("Error " + err)
                    // console.log("Time to live " + res);
                });
            }); // 43200 - 12 hours
        });
    });
};

module.exports = {
    save: save,
    del: del,
    get: get
}
