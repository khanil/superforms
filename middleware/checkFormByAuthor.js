var HttpError = require('../error').HttpError;
var users = require('../models/user.js')


module.exports = function(req, res, next) {
	if(!req.form)
		return next(new HttpError(404, 'Запрашиваемая форма не найдена.'));
	// check user
	var role = req.user.role;
	(role === 'admin' || role === 'root' || req.user.id === req.form.user_id)?
		next() : next(new HttpError(403, "Нет доступа."))
		
}