// set debugMode
global.debugMode = false;

exports.extends = function (constructor) {

    // find the matching key value pair in array object
    constructor.prototype.keyExists = function (key) {
        var v, x = false;
        this.forEach(function (k) {
            for (v in k) {
                if (k.hasOwnProperty(key))
                    x = true;
            }
        })
        return x;
    };

    // return the matching key value pair in array object
    constructor.prototype.getKey = function (key) {
        var v, x = null;
        this.forEach(function (k) {
            for (v in k) {
                if (k.hasOwnProperty(key))
                    x = k[key];
            }
        })
        return x;
    };

    // get array item index by 'key' attribute
    constructor.prototype.getIndexBy = function (name, value) {
        for (var i = 0; i < this.length; i++) {
            if (this[i][name] == value) {
                return i;
            }
        }
        return -1;
    };

    // copy client info to a permananent place
    constructor.prototype.sync = function (db) {
        this.forEach(function (item) {
            db.get(item.name, {
                include_docs: true
            }).then(function (client) {
                client.id = item.id;
                return db.put(client, client._rev);
            }).catch(function (err) {
                var client = item;
                client._id = item.name;
                db.put(client, client._rev);
            });
        });
    }
}