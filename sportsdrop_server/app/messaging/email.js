require('../api/globals').extends(Array);

var fs = require('fs');
var shell = require('shelljs');
var checkEmail = require('legit');

// establish a connection to user database
var devMail = require('./mail.js');
var database = require('../models/database');
var userTemplate = require('../models/user');
var usersPendingVerification = debugMode ? [] : require('../models/redis');

// email links and log file
var logFile = database.logging,
    link;
var host = '<ip/domain>';

var emailSubject = 'SportsDrop - Play Anywhere';
var emailTitle = 'SportsDrop Registration Successful';

function genID(len) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        id = '';
    if (len === undefined)
        len = 30;
    for (var i = 0; i < len; i++)
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    return id;
};

function htmlInsert(html, link, linkID) {
    var rawHTML = htmlPage(html);
    return fs.writeFileSync(html + '.' + linkID,
        rawHTML.replace('__link__reference__', link));
};

function htmlPage(filePath) {
    var html = fs.readFileSync(filePath, 'utf8');
    return html;
};

function sendEmailConfirmation(address, dir, linkID, emailHTML) {

    if (linkID)
        linkID = '.' + linkID;

    var command = dir + '/mail.sh' +
        ' "' + emailTitle + '"' +
        ' "' + emailSubject + '"' +
        ' "' + address + '"' +
        ' ' + dir + emailHTML + linkID;
    dt = new Date();

    // return the log message
    logLine = function (email, msg) {
        return email + ' ' + msg + ' ' + dt.toString()
    };

    // execute the shell script
    // method 1:
    // shell.exec('sh ' + command,
    // function (error, stdout, stderr) {
    // if (error) // there was an error executing the script
    // console.log(address + ' ' + error + ' :' + dt);
    // return logFile.put(logLine(address, error));
    // if (stderr) // output any errors our script encounters while executing
    // console.log(address + ' ' + stderr + ' :' + dt);
    // return logFile.put(logLine(address, stderr));
    // all ok output the success message
    // console.log(address + ' ' + stdout + ' :' + dt);
    // return logFile.put(logLine(address, stdout));
    // });

    // method 2:
    var exec = require('child_process').exec;
    var child;
    child = exec(command, function (error, stdout, stderr) {
        if (!stderr)
            console.log('stdout: ' + stdout);
        else
            console.log('stderr: ' + stderr);
        if (error !== null) {
            console.log('exec error: ' + error);
        }
    });
};

function newUser(request, user, next) {

    var userID = genID(50);

    host = request.get('host');
    link = "http://" + host +
        "/sportsdrop/verify?id=" + userID;

    if (debugMode) {
        var userMailObj = {};

        userMailObj[userID] = user;
        usersPendingVerification.push(userMailObj);
    } else
        usersPendingVerification.save(userID, user, 60 * 60); // set token expiration - 1hr

    htmlInsert(__dirname + '/email-registration.html', link, userID);

    if (debugMode) {
        var emailBody = htmlPage(__dirname + '/email-registration.html.' + userID);
        devMail.sendEmailConfirmation(user.email, {
            subject: 'Verification required',
            body: emailBody
        }, next);
        return;
    }

    checkEmail(user.email, function (valid, mx, err) {
        if (valid) {
            sendEmailConfirmation(user.email, __dirname, userID, '/email-registration.html');
            next();
        } else {
            usersPendingVerification.del(userID);
            next(err);
        }
    });
};

function verifyUser(request, result, authentication) {

    if ((request.protocol + "://" + request.get('host')) == ("http://" + host)) {

        if (debugMode) {
            if (usersPendingVerification.keyExists(request.query.id)) {
                var newUser = usersPendingVerification.getKey(request.query.id);
                newUser.save(function () {

                    authentication.put(newUser).then(function (done) {
                        usersPendingVerification = [];

                        fs.unlink(__dirname + '/email-registration.html.' + request.query.id, (err) => {
                            if (err)
                                return console.log('Unable to delete relic registration file');
                            console.log('Successfully deleted relic registration file');
                        });

                        return result.send(htmlPage(__dirname + '/email-verified.html'));

                    }).catch(function (err) {
                        newUser.pass = tempPass;
                        return result.send(htmlPage(__dirname + '/email-error.html'));

                    });

                });
            }
        } else {

            usersPendingVerification.get(request.query.id).then(function (userData) {
                var newUser = new userTemplate(userData.name, userData.email, userData.pass);
                var tempPass = newUser.pass;

                newUser.save(function () {

                    authentication.put(newUser).then(function (done) {
                        usersPendingVerification.del(request.query.id);
                        return result.send(htmlPage(__dirname + '/email-verified.html'));

                    }).catch(function (err) {
                        newUser.pass = tempPass;
                        return result.send(htmlPage(__dirname + '/email-error.html'));

                    });

                });
            });
        }
    } else
        return "<h1>Bad Request</h1>";
    // } else
    //     return "<h1>Unauthorized Request</h1>";
};

function resendPassword(userData, authentication) {

    return new Promise(function (resolve, reject) {

        userData._id = 'org.couchdb.user:' + userData.name;
        authentication.get(userData._id).then(function (user) {
            // hold user information inside temporary model
            thisUser = new userTemplate(userData.name, userData.email, userData.newpassword, user.login_status);
            return thisUser.save(function () {
                authentication.put(user, user._rev).then(function () {
                    sendEmailConfirmation(thisUser.email, __dirname, '', '/email-password-reset.html');
                    return true;
                }).then(function (res) {
                    return resolve('Please check your Inbox');
                }).catch(function (err) {
                    return reject(console.log(err));
                });
            });
        }).then(function (res) {
            console.log(res);
        }).catch(function (err) {
            return reject(console.log(err));
        });
    });
};

module.exports = {
    newUser: newUser,
    verifyUser: verifyUser,
    resendPassword: resendPassword
};