'use strict'

var crypto = require('crypto');

/** 
 * larger numbers mean better security and larger
 * salt means hashed passwords are more resistant to
 * rainbow table, but you get diminishing returns pretty fast
 */
var config = {
    saltBytes: 16
};

/**
 * generates random string of characters i.e salt
 * @function
 * @param {number} length - Length of the random salt.
 */
var genSalt = function (length) {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString('hex') /** convert to hexadecimal format */
        .slice(0, length); /** return required number of characters */
};

/**
 * hash password with sha512.
 * @function
 * @param {string} password - List of required fields.
 * @param {string} salt - Data to be validated.
 */
var sha512 = function (password, salt) {
    var hash = crypto.createHmac('sha512', salt); /** Hashing algorithm sha512 */
    hash.update(password);
    var value = hash.digest('hex');
    var password = value;
    return {hash: password, salt: salt};
};

function saltHashPassword(userpassword) {
    var salt = genSalt(config.saltBytes); /** Gives us a base64 encodede salt of length 16 */
    var password = sha512(userpassword, salt);
    return password;
}

/**
 * Verify a password salt and hash function.
 *
 * Accepts a hash and salt, and returns whether the
 * hash matched the password (as a boolean).
 *
 * @param {!String} password submitted by user on login
 * @param {!String} password containing hash and salt
 * as retreived from persistent storage
 */
function compareSaltHash(submitted, userpassword) {
    var err = null;
    var verified = null;
    var hash = userpassword.hash;
    var salt = userpassword.salt;
    var result = sha512(submitted, salt);
    if (result.hash === hash)
        verified = true; /** exact match */
    else err = true; /** no match */
    return {
        err: err,
        verified: verified
    }
}

function generateSocketKey(length) {
    var key = "";
    var churn = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < length; i++)
        key += churn.charAt(Math.floor(Math.random() * churn.length));
    return key;
}

module.exports = {
    save: saltHashPassword,
    verify: compareSaltHash,
    socket: generateSocketKey
}