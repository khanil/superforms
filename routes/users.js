var users = require('../models/user');
var forms = require('../models/form');
var HttpError = require('../error').HttpError;
var mailer = require('../libs/mailer')


exports.sendSignInUpPage = function (req, res, next) {
	res.render('signin-up');
};


exports.signIn = function (req, res, next) {
	var user = JSON.parse(req.body);

	users.findByMail(user.email)
		.then(result => {
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
	try {
		var user = JSON.parse(req.body);
	} catch (err) {
		return next(err);
	}


	users.findByMail(user.email)
		.then(result => {
			if(result) {
				next(new HttpError(302, 'Вы уже зарегистрированы. Пожалуйста, авторизуйтесь.'));
			} else {
				return users.add(user);
			}
		})
		.then(result => {
			if(result) {
				user.id = users.getHash(result.id);
				req.session.user = user.id;
				res.send('Письмо для подтверждения регистрации отправлено Вам на почту.');
				return mailer.sendRegistryConfirm(user);
			}
		})
		.then(result => {
			console.log(result);
		})
		['catch'](next);
};


exports.signOut = function (req, res, next) {
	if(req.session)
		req.session.destroy(function(err) {
			if(err) return next(err);
	  		res.redirect('/user#signin');
		})
	else {
		res.redirect('/user#signin');
	} 
};



exports.confirmRegistration = function (req, res, next) {
	var id = users.getID(req.params.id);
	var message = { 
		title : 'Ваш аккаунт успешно активирован :)',
		text : 'Удачных опросов!'
	};

	Promise.resolve()
		.then(() => { return users.findOne(id); })
		.then(result => {
			if(!result) {
				throw new HttpError(404, 'Данный пользователь не найден.');
			} else {
				if(result.status !== 'waiting'){
					res.render('message', message); 
				}
			}
		})
		.then(() => { users.update(id, { 'status' : 'active' }); })
		.then(() => { 
			req.session.user ?
				message.text = 'Чтобы войти в новый аккаунт, Вам потребуется выйти с текущего.' :
				req.session.user = req.params.id;

			res.render('message', message); 

		})
		['catch'](next);

}
	
