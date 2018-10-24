var passport = require('passport');
var passportJWT = require("passport-jwt");

// create web token strategy
var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;

// load up the user model
var User = require('../app/models/user');

// get jwt config file
var JWT = require('../config/jwt-config');

// get db config file
var config = require('../app/models/database');

// web token parameters
var params = {};
params.jwtFromRequest = ExtractJwt.fromAuthHeader();
params.secretOrKey = JWT.secret;

module.exports = {
    run: passport.use(new JwtStrategy(params, function (jwt_payload, done) {
            config.users.get("org.couchdb.user:" + jwt_payload.name, function (err, doc) {
                if (err) {
                    return done(null, err.error);
                }
                if (doc) {
                    done(null, doc._id);
                } else {
                    done(null, false);
                }
            })
        })),
    initialize: function () {
        return passport.initialize();
    },
    authenticate: function () {
        return passport.authenticate("jwt", JWT.session);
    },
    secret: params.secretOrKey
}