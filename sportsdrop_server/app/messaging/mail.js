var fs = require('fs');
var checkEmail = require('legit');
var nodemailer = require('nodemailer');
var transport = {
    fastMailService: {
        host: "in1-smtp.messagingengine.com",
        port: 587,
        secure: false,
        auth: {
            user: "registration@sportsdrop.co.uk",
            pass: "fa5tma1l5mart"
        },
        tls: {
            ciphers: 'SSLv3'
        }
    },
    gmailService: {
        service: "Gmail",
        auth: {
            user: "youremail@gmail.com",
            pass: "password"
        }
    },
    outlookService: {
        host: "smtp-mail.outlook.com",
        port: 587,
        secureConnection: false,
        auth: {
            user: "user@outlook.com",
            pass: "password"
        },
        tls: {
            ciphers: 'SSLv3'
        }
    },
    office365Service: {
        host: "smtp.office365.com",
        port: 587,
        secure: false,
        auth: {
            user: "username",
            pass: "password"
        },
        tls: {
            ciphers: 'SSLv3'
        }
    }
}

var smtpTransport = nodemailer.createTransport(transport.gmailService);

function htmlPage(filePath) {
    var html = fs.readFileSync(filePath, 'utf8');
    return html;
};

// send email confirmation
function sendEmailConfirmation(user, emailContent, next) {

    var mailOptions = {
        to: user,
        subject: emailContent.subject,
        html: emailContent.body
    };

    smtpTransport.sendMail(mailOptions, function (err, res) {
        if (err) {
            next({
                err: err.response
            });
        } else {
            next({
                success: res
            });
        }
    });
};

// domain exists
function domainExists(user, mx, err) {
    var exists = false,
        dom = user.substring(user.lastIndexOf("@") + 1, user.lastIndexOf("."));
    for (var i = 0; i < mx.length; i++) {
        if (mx[i].exchange.includes(dom)) {
            exists = true
            break;
        }
    }
    if (!exists && !err)
        err = "no domain"
    return [exists, err]
};

// list of available mail services:
module.exports = {
    sendEmailConfirmation: sendEmailConfirmation
};