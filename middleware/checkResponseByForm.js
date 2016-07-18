var HttpError = require('../error').HttpError;
var responses = require('../models/response.js');

module.exports = function(req, res, next) {
	if(!req.form)
		return next(new HttpError(404, 'Данная форма не найдена.'));

	if(!req.response) 
		return next(new HttpError(404, "Данный ответ не найден."));
	
	return (req.form.id !== req.response.form_id) ?
		next(new HttpError(403, 'Нет доступа к данным.')) : next();
};