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
			var options = { tempSalt: users.genSalt() }
			if(foundUser) {
				options.email = foundUser.email
				req.session.signin = options
				let salt = users.getSalt(foundUser.hash)
				res.send(salt + '$' + options.tempSalt)
				// there is only 15 seconds to authenticate
				setTimeout(() => delete(req.session.signin), 15000)
			} else {
				// method stub
				res.send(users.genSalt() + '$' + options.tempSalt)
			}
		})
		.catch(next);
}


exports.signIn = function (req, res, next) {
	var user = req.session.signin
	delete(req.session.signin)
	if(!(user && user.email)) return next(new HttpError(422, 'Неверный логин или пароль. Пожалуйста, попробуйте снова.'))
	
	user.hash = req.body
	users.findOne(user.email)
		.then(foundUser => {
			var err;
			if(foundUser && users.compare(user.hash, foundUser.hash, user.tempSalt)) {
				switch(foundUser.status) {
					case 'active': 
						req.session.user = users.encode(foundUser.id);
						res.sendStatus(200);
						return;
					case 'waiting': err = new HttpError(422, `Требуется подтверждение регистрации. Пожалуйста, проверьте Вашу электронную почту или свяжитесь с администратором.`); break;
					case 'banned': err = new HttpError(422, 'Ваш аккаунт заблокирован. Пожалуйста, свяжитесь с администратором.')
				}
			}
			throw err || new HttpError(422, 'Неверный логин или пароль. Пожалуйста, попробуйте снова.');
		})
		.catch(next);
};


exports.sendSignUpSalt = (req, res, next) => {
	var options = {	tempSalt: users.genSalt() }
	req.session.signup = options;
	res.send(options.tempSalt)
	setTimeout(() => delete(req.session.signup), 15000)
}

exports.signUp = function (req, res, next) {
	var user, info = req.session.signup
	if(!info) return next()

	delete(req.session.signup)

	Promise.resolve(users.decrypt(req.body, info.tempSalt))
		.then(newUser => user = JSON.parse(newUser))
		.then(users.add) // add the user into db
		.then(newUser => {
			user.id = newUser.id; // write id to the enclosing object 'user'
			user.status = 'active';
			return users.addRole(user.id, user.role)} )
		.then(() => users.changeStatus(user.id, user.status)) // add status into db
		//  
		// .then(() => users.addRegConfirm(user.id))
		// .then(registration => mailer.sendRegConfirm(user, registration.token)) // send an email for registry confirmation
		.then(() => {
			const data = JSON.stringify({
				id: users.encode(user.id),
				password: user.password,
				status: user.status
			})
			res.send(users.encrypt(data, info.tempSalt))
		})
		// .catch(err => {
		// 	if(err instanceof SmtpError) {
		// 		users.delete(user.id);
		// 	}
		// 	throw err
		// })
		.catch(next)
};


exports.changeUserOptions = (req, res, next) => {
	const { email, flag, value } = req.params;
	users.findOne(email)
		.then(foundUser => {
			if(foundUser) {
				switch(flag) {
					case 'status':
						if(!~['active', 'banned'].indexOf(value)) {
							throw new HttpError(404, 'incorrect value') 
						}
						return users.changeStatus(foundUser.id, value);
					case 'password':
						return users.changePassword({ id: foundUser.id, password: value })
					default:
						throw new HttpError(404, 'incorrect action')
				}
			} else {
				throw new HttpError(404, 'Пользователь с таким email не найден.')
			}
		})
		.then(() => {
			res.render('message', {
				title: 'Успех!',
				html: `Настройки пользователя <strong>${email}</strong> были изменены.`,
			})
		})
		.catch(next);
}


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