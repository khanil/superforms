var HttpError = require('../error').HttpError;

module.exports = function(req, res, next) {
	if(req.user) {
		switch(req.user.status) {
			case 'banned' : return next(new HttpError(401, 'Ваш аккаунт заблокирован.'));
			case 'waiting' :
			// case 'waiting' : return next(new HttpError(401, 'Требуется подтверждение регистрации.'));
			case 'active' : return next();
		}
	}
	// redirect to sign in if request ins't XHR 
	if (!res.req.headers['x-requested-with']) {
		return res.render('signin');
	}
	next(new HttpError(401, "Вы не авторизованы."));
};