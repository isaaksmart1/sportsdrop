var encrypt = require('../api/encryption');

// set up a user model
function UserModel(name, email, password) {
    this._id = "org.couchdb.user:" + name;
    this.name = name;
    this.email = email;
    this.pass = password;
    this.type = "user";
    this.roles = ["non_admin"];
    this.login_status = false;
    this.expires = -1;
    this.session = {
        profile: {
            name: name,
            email: email,
            community: []
        }
    };
    // this.socketKey = "";
};

// save user model prototype
UserModel.prototype.save = function (next) {
    var user = this;
    if (user.pass !== null) {
        user.pass = encrypt.save(user.pass);
        // user.socketKey = encrypt.socket(20);
        next();
    } else {
        return next();
    }
};

// compare user password prototype
UserModel.prototype.comparePassword = function (challenge, callback) {
    if (this.pass !== null) {
        var comparison = encrypt.verify(challenge, this.pass);
        callback(comparison.err, comparison.verified);
    }
};

module.exports = UserModel;

// http://blog.matoski.com/articles/jwt-express-node-mongoose/