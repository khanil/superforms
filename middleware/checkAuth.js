var HttpError = require('../error').HttpError;

module.exports = function(req, res, next) {
	if(req.user) {
		switch(req.user.status) {
			case 'banned' : return next(new HttpError(401, 'Ваш аккаунт заблокирован.'));
			// case 'waiting' : return next(new HttpError(401, 'Требуется подтверждение регистрации.'));
			case 'active' : return next();
		}
	}
	res.redirect(res.redirect('/user#signin'))
	// next(new HttpError(401, "Вы не авторизованы."));
};