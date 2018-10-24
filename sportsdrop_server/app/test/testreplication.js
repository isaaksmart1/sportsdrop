// Requiring the package 
var PouchDB = require('pouchdb');

// Creating local database object
var localdb = 'http://node.couchdb.sd.admin:DB5lav3@127.0.0.1:9065/sample_database';
var localDB = new PouchDB(localdb);

// Creating remote database object 
var remotedb = 'http://node.couchdb.sd.admin:DB5lav3@176.58.124.143:9065/sample_database';
var remoteDB = new PouchDB(remotedb);

// Create some local database documents
doc1 = {
    _id: '001',
    name: 'Ram',
    age: 23,
    Designation: 'Programmer'
}
doc2 = {
    _id: '002',
    name: 'Robert',
    age: 24,
    Designation: 'Programmer'
}
doc3 = {
    _id: '003',
    name: 'Rahim',
    age: 25,
    Designation: 'Programmer'
}
docsArray = [doc1, doc2, doc3]

// Inserting Documents
localDB.bulkDocs(docsArray, function (err, response) {
    if (err) {
        return console.log(err);
    } else {
        console.log("Documents created Successfully");
    }

    // Replicating a local database to => Remote database
    PouchDB.replicate(localDB, remoteDB, {
        create_target: true,
        continuous: true
    }).then(function (res) {
        console.log(res);
        console.log("Database replicated successfully");

        // Verify whether the remote database is replicated
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
    })
});