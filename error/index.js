var path = require('path');
var util = require('util');
var http = require('http');
var logger = require('../libs/logger');

// HTTP error constructor
function HttpError(status, message) {
	Error.apply(this, arguments);
	Error.captureStackTrace(this, HttpError);

	this.status = status;
	this.message = message || http.STATUS_CODES[status] || "Error";
}

util.inherits(HttpError, Error);
HttpError.prototype.name = "HttpError";

exports.HttpError = HttpError;


// main error handler 
exports.errorHandler = function (err, req, res, send) {
	var requestData = { method: req.method, url: req.url };
  if(typeof(err) === 'number') {
    err = new HttpError(err);
  } 
  if(err instanceof HttpError) {
    logger.httpError(err.stack, requestData);
    res.sendHttpError(err);
  } else {
    logger.log('error', err.stack, requestData);
    res.sendHttpError(new HttpError(500, 'Неизвестная ошибка сервера.'));
  } 
}

