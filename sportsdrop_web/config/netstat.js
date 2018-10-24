// list of network ip addresses and ports

config = {
    http: {
        dev: 'localhost',
        prod: 'localhost',
        port: 8050
    },
    https: {
        dev: 'localhost',
        prod: 'localhost',
        port: 443
    }
}

module.exports = {
    http: config.http,
    https: config.https
}