var users = require('../models/user');
var forms = require('../models/form');
var HttpError = require('../error').HttpError;
var SmtpError = require('../error').SmtpError;
var mailer = require('../libs/mailer')
var CryptoJS = require('../libs/cryptoJS')


exports.sendSignInPage = (req, res) => {
	res.render('signin');
}

exports.sendSignInSalt = (req, res, next) => {
	users.findOne(req.body)
		.then(foundUser => {
			if(foundUser) {
				var options = {
					email: foundUser.email,
					salt: users.getSalt(foundUser.hash),
					temporarySalt: users.genSalt()
				}
				req.session.signin = options;
				res.send(options.salt + '$' + options.temporarySalt)
				setTimeout(() => delete(req.session.signin), 15000)
			} else {
				next(new HttpError(422, 'Неверный логин или пароль. Пожалуйста, попробуйте снова.'));
			}
		})
		.catch(next);
}

exports.signIn = function (req, res, next) {
	var user = req.session.signin
	delete(req.session.signin)
	if(!user) return next()
	
	user.hash = req.body
	users.findOne(user.email)
		.then(foundUser => {
			var err;
			if(foundUser && users.compare(user.hash, foundUser.hash, user.temporarySalt)) {
				switch(foundUser.status) {
					case 'active': 
						req.session.user = users.encode(foundUser.id);
						res.sendStatus(200);
						return;
					case 'waiting': err = new HttpError(422, 'Требуется подтверждение регистрации.'); break;
					case 'banned': err = new HttpError(422, 'Ваш аккаунт заблокирован. Пожалуйста, свяжитесь с администратором.')
				}
			}
			throw err || new HttpError(422, 'Неверный логин или пароль. Пожалуйста, попробуйте снова.');
		})
		.catch(next);
};


exports.sendSignUpSalt = (req, res, next) => {
	var options = {	temporarySalt: users.genSalt() }
	req.session.signup = options;
	res.send(options.temporarySalt)
	setTimeout(() => delete(req.session.signup), 15000)
}

exports.signUp = function (req, res, next) {
	var user, info = req.session.signup
	if(!info) return next()

	delete(req.session.signup)

	Promise.resolve(users.decrypt(req.body, info.temporarySalt))
		.then(newUser => user = JSON.parse(newUser))
		.then(users.add) // add the user into db
		.then(newUser => {
			user.id = newUser.id; // write id to the enclosing object 'user'
			return users.addRole(user.id, user.role)} )
		.then(() => users.changeStatus(user.id)) // add status into db
		//  
		.then(() => users.addRegConfirm(user.id))
		.then(registration => mailer.sendRegConfirm(req.user, user, registration.token)) // send a letter for registry confirmation
		.then(() => res.send(users.encode(user.id)))
		.catch(err => {
			if(err instanceof SmtpError) {
				users.delete(user.id)	
			}
			throw err
		})
		.catch(next)
};


exports.confirmRegistration = function (req, res, next) {
	users.findToken(req.params.token)
		.then(regConfirm => {
			if(regConfirm) {
				return users.changeStatus(regConfirm.user_id, 'active')
			}
			throw new HttpError(404, 'Страница не найдена.')
		})
		.then(() => { 
			res.render('message', {
				title : 'Ваш аккаунт успешно активирован :)', 
				text : 'Удачных опросов!' 
			}); 
		})
		.catch(next)
};
	

exports.signOut = function (req, res, next) {
	if(req.session)
		req.session.destroy(function(err) {
			if(err) return next(err);
			res.redirect('/');
		})
	else {
		res.redirect('/');
	} 
};


exports.getAll = (req, res, next) => {
	users.findAll()
		.then( foundUsers => {
			for(let i = 0; i < foundUsers.length; i++) {
				foundUsers[i].id = users.encode(foundUsers[i].id);
			}
			res.json(foundUsers)
		})
		.catch(next)
} 