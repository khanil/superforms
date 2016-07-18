var HttpError = require('../error').HttpError;

module.exports = function(req, res, next) {
	(req.user) ? next() : next(new HttpError(401, "Вы не авторизованы"));
};