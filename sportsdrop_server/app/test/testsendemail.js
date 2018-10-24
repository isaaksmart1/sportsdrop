var nodemailer = require('nodemailer');

var gmailService = {
    service: "Gmail",
    auth: {
        user: "youremail@gmail.com",
        pass: "password"
    }
};

var fastmailService = {
    port: 465,
    service: "smtp.fastmail.com",    
    // service: "smtps-proxy.fastmail.com",
    auth: {
        user: "registration@sportsdrop.co.uk",
        pass: "4qdr7aq2rqf3spl5"
    },
    tls: {
        ciphers: 'SSLv3'
    }
};

var smtpTransport = nodemailer.createTransport(fastmailService);

function testSendEmail(user, emailSubject, emailBody) {

    mailOptions = {
        to: user,
        subject: emailSubject,
        html: emailBody
    };

    smtpTransport.sendMail(mailOptions, function (err, res) {
        if (err) {
            console.log('send email to ' + user + ' failed');
            console.log(res);
            console.log(err);
        } else {
            console.log('send email to ' + user + ' succeeded');
        }
    });
};