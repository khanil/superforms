var HttpError = require('../error').HttpError;
var forms = require('../models/form.js');

module.exports = function(req, res, next) {
	if(!req.form)
		return next(new HttpError(404, 'Запрашиваемая форма не найдена.'));

	return (req.user.role === 'admin' || req.user.role === 'root' || req.user.id !== req.form.user_id)?
		next() :
		next(new HttpError(403, "Нет доступа."))
}