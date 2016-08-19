var HttpError = require('../error').HttpError;
var forms = require('../models/form.js');

module.exports = function(req, res, next) {
	if(!req.user) 
		return next(new HttpError(401, "Вы не авторизованы"));

	if(!req.form)
		return next(new HttpError(404, 'Данная форма не найдена.'));

	return (req.user.id !== req.form.user_id) ?
		next(new HttpError(403, 'Нет доступа к данным.')) : next();
}