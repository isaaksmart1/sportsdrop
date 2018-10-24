var checkEmail = require('legit');

function testEmail (emailAddress) {
    checkEmail(emailAddress, function (valid, mx, err) {
        if (valid) {
            console.log('email address ' + emailAddress + ' is valid');
        } else {
            console.log('email address ' + emailAddress + ' is not valid');
        }
    });
};