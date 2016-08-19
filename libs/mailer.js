var nodemailer = require('nodemailer')
var config = require('../config')
var SmtpError = require('../error').SmtpError;
var smtpTransport = nodemailer.createTransport(config.get('nodemailer:trans'));


exports.send = (options) => {
    // localhost:3000/user/confirm_registration/:confirm_id
    var link = config.get('domain') + 'forms/' + options.id;

    var mailOptions = {
        from: 'Form generator <generator.form@yandex.ru>', // sender address
        to: options.recipients, // list of receivers 
        subject: options.topic || 'Новый опрос!', // Subject line 
        text: (options.message || 'Пожалуйста, заполните форму:') + '\n' + link, // plaintext body 
    }
    console.log('mail options:\n', mailOptions);
    // return sendMail(mailOptions);
}


exports.sendRegConfirm = (user) => {
    // localhost:3000/user/confirm_registration/:confirm_id
    var link = config.get('domain') + 'user/confirm_registration/' + user.regConfirmHash;

    var mailOptions = {
        from: 'Form generator <generator.form@yandex.ru>', // sender address
        to: user.email, // list of receivers 
        subject: 'Подтверждение регистрации', // Subject line 
        text: 'Чтобы завершить регистрацию, перейдите по следующей ссылке:\n' + link, // plaintext body 
    }
    console.log('mail options:\n', mailOptions);
    // return sendMail(mailOptions);
}

function sendMail(mailOptions) {
    return new Promise((resolve, reject) => {
        // send mail with defined transport object 
        smtpTransport.sendMail(mailOptions, function(err, response){
            // if you don't want to use this transport object anymore, uncomment following line 
            smtpTransport.close(); // shut down the connection pool, no more messages 
            if(err) {
                err.__proto__ = SmtpError.prototype;
                reject(err);
            } else {
                resolve();
            }
        });
    })
}