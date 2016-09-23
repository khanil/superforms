var users = require('../models/user');
var config = require('../config')
var nodemailer = require('nodemailer')
var smtpTransport = require('nodemailer-smtp-transport');
var transporter = nodemailer.createTransport(smtpTransport(config.get('nodemailer')));
var SmtpError = require('../error').SmtpError;


exports.sendRegConfirm = (admin, user, regToken) => {
	// localhost:3000/user/confirm_registration/:confirm_id
	var link = config.get('domain') + 'confirm_registration/' + regToken;

	var mailOptions = {
		from: "Form Generator <g-f@mosk.spb.ru>", // sender address
		to: user.email, // list of receivers 
		subject: 'Подтверждение регистрации', // Subject line 
		html: 
			`<h3>Добрый день, ${user.name} ${user.patronymic}!<h3> 
			<p>${admin.surname} ${admin.name[0]}.${admin.patronymic[0] + '.' || ''} зарегистрировал Вас в сервисе Form Generator.</p>
			<p>Логин: ${user.email}</p>
			<p>Пароль: ${user.password}</p>
			<p>Чтобы завершить регистрацию, пожалуйста, перейдите по следующей ссылке:</p>
			<a href=${link}>${link}</a>`
	}
	console.log('mail options:\n', mailOptions);
	return sendMail(mailOptions);
}

function sendMail(mailOptions) {
	return new Promise((resolve, reject) => {
		// send mail with defined transport object 
		transporter.sendMail(mailOptions, function(err, response){
			// if you don't want to use this transport object anymore, uncomment following line 
			// smtpTransport.close(); // shut down the connection pool, no more messages 
			if(err) {
				err.__proto__ = SmtpError.prototype;
				reject(err);
			} else {
				resolve(response);
			}
		});
	})
}


// transporter.sendMail({
// 	from: "Form Generator ✔ <g-f@mosk.spb.ru>", // sender address
// 	to: "d346bca90e94bac7fed08f7e78578ad4$ab33e415f71@mail.ru, KDJAjlk#dj!kadlk@mail",// list of receivers
// 	subject: "One more test", // Subject line
// 	html: "<b>Here will be a link for interview.</b>" // html body
// }, function(err, response){
// 	// if you don't want to use this transport object anymore, uncomment following line 
// 	console.log(err ? err : response)
// });


// { Error: Can't send mail - all recipients were rejected: 550 Restricted characters in address
//     at SMTPConnection._formatError (/home/hellmaker/education/nodejs/superforms/node_modules/smtp-connection/lib/smtp-connection.js:493:15)
//     at SMTPConnection._actionRCPT (/home/hellmaker/education/nodejs/superforms/node_modules/smtp-connection/lib/smtp-connection.js:1259:34)
//     at SMTPConnection.<anonymous> (/home/hellmaker/education/nodejs/superforms/node_modules/smtp-connection/lib/smtp-connection.js:1214:26)
//     at SMTPConnection._processResponse (/home/hellmaker/education/nodejs/superforms/node_modules/smtp-connection/lib/smtp-connection.js:634:16)
//     at SMTPConnection._onData (/home/hellmaker/education/nodejs/superforms/node_modules/smtp-connection/lib/smtp-connection.js:458:10)
//     at emitOne (events.js:96:13)
//     at TLSSocket.emit (events.js:188:7)
//     at readableAddChunk (_stream_readable.js:176:18)
//     at TLSSocket.Readable.push (_stream_readable.js:134:10)
//     at TLSWrap.onread (net.js:543:20)
//   code: 'EENVELOPE',
//   response: '550 Restricted characters in address',
//   responseCode: 550,
//   command: 'RCPT TO' }

// { accepted: [ 'd346bca90e94bac7fed08f7e78578ad4$ab33e415f71@mail.ru' ],
//   rejected: [ 'KDJAjlk#dj!kadlk@mail' ],
//   rejectedErrors: 
//    [ { Error: Recipient command failed: 550 Restricted characters in address
//          at SMTPConnection._formatError (/home/hellmaker/education/nodejs/superforms/node_modules/smtp-connection/lib/smtp-connection.js:493:15)
//          at SMTPConnection._actionRCPT (/home/hellmaker/education/nodejs/superforms/node_modules/smtp-connection/lib/smtp-connection.js:1245:20)
//          at SMTPConnection.<anonymous> (/home/hellmaker/education/nodejs/superforms/node_modules/smtp-connection/lib/smtp-connection.js:1214:26)
//          at SMTPConnection._processResponse (/home/hellmaker/education/nodejs/superforms/node_modules/smtp-connection/lib/smtp-connection.js:634:16)
//          at SMTPConnection._onData (/home/hellmaker/education/nodejs/superforms/node_modules/smtp-connection/lib/smtp-connection.js:458:10)
//          at emitOne (events.js:96:13)
//          at TLSSocket.emit (events.js:188:7)
//          at readableAddChunk (_stream_readable.js:176:18)
//          at TLSSocket.Readable.push (_stream_readable.js:134:10)
//          at TLSWrap.onread (net.js:543:20)
//        code: 'EENVELOPE',
//        response: '550 Restricted characters in address',
//        responseCode: 550,
//        command: 'RCPT TO',
//        recipient: 'KDJAjlk#dj!kadlk@mail' } ],
//   response: '250 OK id=1blfj4-0003wr-Dw',
//   envelope: 
//    { from: 'g-f@mosk.spb.ru',
//      to: 
//       [ 'd346bca90e94bac7fed08f7e78578ad4$ab33e415f71@mail.ru',
//         'KDJAjlk#dj!kadlk@mail' ] },
//   messageId: 'd50d9044-ebc3-ab94-e120-76e39558052a@mosk.spb.ru' }