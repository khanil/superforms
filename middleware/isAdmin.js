var HttpError = require('../error').HttpError;

module.exports = function(req, res, next) {
	var role = req.user.role;
	return (role === 'admin' || role === 'root')?
		next() :
		next(new HttpError(403, "Нет доступа."))
};