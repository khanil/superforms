var path = require('path');
var util = require('util');
var http = require('http');
var logger = require('../libs/logger');

// HTTP error constructor
function HttpError(status, message) {
	Error.captureStackTrace(this, HttpError);
	this.status = status,
	this.message = message || http.STATUS_CODES[status] || "HTTP error"
}

function SmtpError(message) {
	Error.captureStackTrace(this, HttpError);
	this.message = message || "SMTP error";
}

function DatabaseError(message) {
	Error.captureStackTrace(this, HttpError);
	this.message = message || "Database error";
}

function createCustomError(MyConstructor, name) {
	MyConstructor.prototype.name = name;
	MyConstructor.prototype = Object.create(Error.prototype);
	MyConstructor.prototype.constructor = MyConstructor;
	return MyConstructor;
} 

exports.HttpError = createCustomError(HttpError, "HttpError");
exports.SmtpError = createCustomError(SmtpError, "SmtpError");
exports.DatabaseError = createCustomError(DatabaseError, "DatabaseError");
	

// main error handler 
exports.errorHandler = function (err, req, res, send) {
	console.log('error handler log:\n', err, err.constructor);
	var requestData = { method: req.method, url: req.url };
	var level;

	if(typeof(err) === 'number') {
		err = new HttpError(err);
	} 

	// an equivalent instanceof operator
	switch(err.constructor) {
		// HTTP error
		case HttpError:
			level = 'WARN';
			err = { httpResponse: err }
			break;
		// Databse error
		case DatabaseError:
			if(err.constraint === 'users_email_key') {
				level = 'WARN'
				err.httpResponse = new HttpError(422, 'Пользователь с данным адресом электронной почты уже существует.')
			}
			break;
		// SMTP protocol error (email sending failed)
		case SmtpError:
			if(err.code === 'EENVELOPE' || err.code === 'ENOTFOUND' || err.code === 'EMESSAGE') {
				level = 'WARN'
				err.httpResponse = new HttpError(422, 'Некорректный адрес электронной почты.')
			}
			break;
	}

	logger.log(level || 'ERROR', err, requestData);
	res.sendHttpError(err.httpResponse || new HttpError(500, 'Неизвестная ошибка сервера'));
}

