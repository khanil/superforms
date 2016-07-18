var users = require('../models/user');
var forms = require('../models/form');
var HttpError = require('../error').HttpError;


exports.sendSignInUpPage = function (req, res, next) {
	res.render('signin-up');
};


exports.signIn = function (req, res, next) {
	var user = JSON.parse(req.body);

	users.findByMail(user.email)
		.then(function (result) {

			if(result && users.compare(user.password, result.password)) {
				req.session.user = users.getHash(result.id);
				res.sendStatus(200);
			} else {
				next(new HttpError(401, 'Неверный логин или пароль. Пожалуйста, попробуйте снова.'));
			}
		})
		['catch'](next);
};


exports.signUp = function (req, res, next) {
	var user = JSON.parse(req.body);

	users.findByMail(user.email)
		.then(function (result) {
			if(result) {
				next(new HttpError(302, 'Вы уже зарегистрированы. Пожалуйста, авторизуйтесь.'));
			} else {
				return users.add(user);
			}
		})
		.then(function(result) {
			if(result) {
				req.session.user = users.getHash(result.id);
				res.sendStatus(200);
			}
		})
		['catch'](next);
};


exports.signOut = function (req, res) {
	if(req.session)
		req.session.destroy(function(err) {
	  	res.redirect('/user#signin');
		})
	else
		res.redirect('/user#signin');
	
};