// list of network ip addresses and ports

ipAddress = {
    dev: 'localhost',
    prod: 'localhost',
    port: 8060
}

dbAddress = {
    dev: 'localhost',
    prod: 'localhost',
    port: 5984
}

redisAddress = {
    dev: 'localhost',
    prod: 'localhost',
    port: 6379,
    url: '',
    pass: ''
}

module.exports = {
    ip: ipAddress,
    db: dbAddress,
    redis: redisAddress
}