var HttpError = require('../error').HttpError;

module.exports = function(req, res, next) {
	(!req.session.user) ? next() : next(new HttpError(401, "Вы уже авторизованы"));
};