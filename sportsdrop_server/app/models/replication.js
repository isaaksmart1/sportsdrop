var PouchDB = require('pouchdb');

var PORT = '9065';
var remoteUrl = '';
var admin = createAdmin('', '');

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

// create a new url
var newUrl = function (url, ip) {
    return "http://" + admin.user + admin.pass + ip + ":" + PORT + "/" + url;
};

// list of remote machines
var machineIPs = {
    node_db_sd_1: '176.58.117.183',
    node_db_sd_2: '176.58.124.143',
    node_db_sd_proxy: '139.162.243.200'
};

// replicate through available ip address (exc. host)
function replicate(localUrl, DBName) {
    ips = Object.keys(machineIPs);
    ips.forEach(ip => {
        if (!(localUrl.includes(machineIPs[ip]))) {
            remoteUrl = newUrl(DBName, machineIPs[ip]);
            startReplication(localUrl, remoteUrl);
        }
    });
};

// run replication (push local to remote)
function startReplication(localUrl, remoteUrl) {

    console.log('Replicating:\n' + localUrl +
        '\n => ' + remoteUrl);

    PouchDB.replicate(localUrl, remoteUrl, {
        create_target: true,
        continuous: true
    }).then(function (res) {

        console.log(res);
        console.log(url + ': Replication successful');

        // verify whether the remote database is replicated
        remoteDB.allDocs({
            include_docs: true,
            attachments: true
        }, function (err, docs) {
            if (err) {
                return console.log(err);
            } else {
                console.log(docs.rows);
            }
        });

    }).catch(function (err) {
        console.log(err);
    });

};

module.exports = {
    run: replicate
};