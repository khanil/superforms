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

function createCustonError(MyConstructor, name) {
    MyConstructor.prototype.name = name;
    MyConstructor.prototype = Object.create(Error.prototype);
    MyConstructor.prototype.constructor = MyConstructor;
    return MyConstructor;
} 

exports.HttpError = createCustonError(HttpError, "HttpError");
exports.SmtpError = createCustonError(SmtpError, "SmtpError");
exports.DatabaseError = createCustonError(DatabaseError, "DatabaseError");
    

// main error handler 
exports.errorHandler = function (err, req, res, send) {
    // console.log('error handler log:\n', err, err.constructor);
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
                err.httpResponse = new HttpError(422, 'Вы уже зарегистрированы. Пожалуйста, авторизуйтесь.')
            }
            break;
        // SMTP protocol error (email sending failed)
        case SmtpError:
            if(err.errors.some( error => error.code === 'ENOTFOUND' || error.code === 'EMESSAGE' )) {
                level = 'WARN'
                err.httpResponse = new HttpError(422, 'Некорректный адрес электронной почты.')
            }
            break;
    }

    logger.log(level || 'ERROR', err, requestData);
    res.sendHttpError(err.httpResponse || new HttpError(500, 'Неизвестная ошибка сервера'));
}

