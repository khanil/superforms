var users = require('../models/user');
var forms = require('../models/form');
var HttpError = require('../error').HttpError;
var SmtpError = require('../error').SmtpError;
var mailer = require('../libs/mailer')


exports.signIn = function (req, res, next) {
	var user = JSON.parse(req.body);

	users.findByMail(user.email)
		.then(foundUser => {
			if(foundUser && users.compare(user.password, foundUser.password)) {
				req.session.user = users.getHash(foundUser.id);
				res.sendStatus(200);
			} else {
				next(new HttpError(422, 'Неверный логин или пароль. Пожалуйста, попробуйте снова.'));
			}
		})
		.catch(next);
};


exports.signUp = function (req, res, next) {
	var user;

	Promise.resolve()
		.then( () => user = JSON.parse(req.body)) // parse request body
		.then( users.add ) // add the user into db
		.then( newUser => {
			user.id = newUser.id; // write id to the enclosing object 'user'
			user.role = 'employee'
			return users.addRole(newUser.id)} )
		.then( () => {
			user.status = 'active';
			return users.changeStatus(user.id, user.status) // add status into db
		})
		// get hash for registry confirmation url and write it to the enclosing object 'user'
		.then( statusLogRow => user.regConfirmHash = users.getRegConfirmHash(statusLogRow) )
		//.then( () => mailer.sendRegConfirm(user) ) // send a letter for registry confirmation
		.then( () => { 
			user.id = users.getHash(user.id);
			delete(user.password)
			delete(user.regConfirmHash)
			res.json(user);
		})
		.catch( err => {
			if(err instanceof SmtpError) {
				users.delete(user.id)	
			}
			throw err
		})
		.catch(next)
};


// exports.confirmRegistration = function (req, res, next) {
// 	var statusLogRow; // a row from 'user_status_logs' table
// 	Promise.resolve()
// 		.then( () => statusLogRow = users.decodeRegConfirmHash(req.params.confirm_id))
// 		.then( () => users.findOne(statusLogRow.user_id))
// 		.then( foundUser => {
// 			if(foundUser && foundUser.status_id === statusLogRow.status_id) 
// 				if(foundUser.status_changed.getTime() === statusLogRow.changed){
// 					return foundUser;
// 				}
// 			throw new HttpError(404); // the user isn't found or is already active 
// 		})
// 		.then( foundUser => users.changeStatus(foundUser.id, 'active'))
// 		.then( () => { 
// 			req.session.user = statusLogRow.id;
// 			res.render('message', { title : 'Ваш аккаунт успешно активирован :)', text : 'Удачных опросов!' }); 
// 		})
// 		['catch'](next);

// }
	

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
				foundUsers[i].id = users.getHash(foundUsers[i].id);
			}
			res.json(foundUsers)
		})
		.catch(next)
} 