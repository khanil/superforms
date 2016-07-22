var nodemailer = require('nodemailer')
var config = require('../config')

var smtpTransport = nodemailer.createTransport(config.get('nodemailer:trans'));


exports.sendRegistryConfirm = (user) => {
    // setup e-mail data with unicode symbols 
    var link = config.get('domain') + 'user/' + user.id + '/confirm_registration';

    var options = {
        from: 'Form generator <generator.form@yandex.ru>', // sender address
        to: user.email, // list of receivers 
        subject: 'Подтверждение регистрации', // Subject line 
        text: 'Чтобы завершить регистрацию, перейдите по следующей ссылке:\n' + link, // plaintext body 
    }

    return sendMail(options);
}

function sendMail(mailOptions) {
    return new Promise((resolve, reject) => {
        // send mail with defined transport object 
        smtpTransport.sendMail(mailOptions, function(error, response){
            if(error) {
                reject(error);
            } else {
                resolve('message has been sent');
            }
         
            // if you don't want to use this transport object anymore, uncomment following line 
            //smtpTransport.close(); // shut down the connection pool, no more messages 
        });
    })
}