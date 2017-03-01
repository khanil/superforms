var config = require('../config');
var forms = require('../models/form');
var HttpError = require('../error').HttpError;
var mailer = require('../libs/mailer')
var users = require('../models/user');

/*
Sending of HTML pages
*/

exports.sendFormsPage = (req, res) => {
	const { name, surname, patronymic } = req.user;
	res.render('forms', { 
		isAdmin: users.isAdmin(req.user), 
		config: {
			user: { id: req.params.user_id, name, surname, patronymic },
			defaultTab: req.session.defaultTab || 'МОИ ФОРМЫ'
		}
	})
}


exports.sendJournalPage = (req, res) => {
	res.render('journal', { isAdmin: users.isAdmin(req.user) });
}


exports.sendGeneratorPage = function (req, res) {
	res.render('generation&edit', { 
		title: 'Создание формы',
		page: 'Главная',
		type: 'CREATE_FORM',
		id: 'id',
		isAdmin: users.isAdmin(req.user)
	});
};


exports.sendEditPage = function(req, res, next) {
	res.render('generation&edit', { 
		title: 'Редактирование формы',
		type: 'EDIT_FORM',
		id: req.params.id,
		isUser: !!req.user,
		isAdmin: users.isAdmin(req.user)
	});
}


exports.sendPreviewPage = function(req, res, next) {
	res.render('preview', { id: req.params.id, isAdmin: users.isAdmin(req.user) });
}


exports.sendInterviewPage = function(req, res, next) {
	res.render('interview', { id: req.params.id,
		isUser: !!req.user,
		isAdmin: (req.user? users.isAdmin(req.user) : false)
	});
}


/*
API
*/

exports.save = function(req, res, next) {
	forms.add(req.user.id, req.body)
		.then(result => {
			res.send(forms.encode(result.id));
		})
		['catch'](next);
};

exports.setDefaultTab = (req, res, next) => {
	req.session.defaultTab = req.body;
	res.sendStatus(200);
}

// get the one form template
exports.getOne = function(req, res, next) {
	res.json( forms.modifyForClient(req.form) );
}


// get an array of all forms for a specific user
exports.getAllForUser = function(req, res, next) {
	forms.findAllForUser(req.user.id)
		.then(foundForms => {
			if(foundForms) {
				for(let i = 0; i < foundForms.length; i++) {
					forms.modifyForClientWithoutItems(foundForms[i])
				}
				res.json(foundForms);
			} else {
				throw new HttpError(404, 'Данная форма не найдена.');
			}
		})
		['catch'](next);
}


// get an array of all forms for a specific organization
exports.getAllForOrg = function(req, res, next) {
	forms.findAllForOrg(req.user.org_id)
		.then(foundForms => {
			if(foundForms) {
				for(let i = 0; i < foundForms.length; i++) {
					forms.modifyForJournal(foundForms[i])
				}
				res.json(foundForms);
			} else {
				throw new HttpError(404, 'Данная форма не найдена.');
			}
		})
		['catch'](next);
}


// update the form template
exports.update = function(req, res, next) {
	var id = req.form.id;
	var updatedFields = {
		template : req.body
	}

	if ( req.headers.referer !== config.get('domain') + 'forms/new' ) {
		updatedFields.edited = new Date();
	}

	forms.update(id, updatedFields)
		.then(result => {
			res.sendStatus(200);
		})
		['catch'](next);
}


// copy the form template
exports.copy = function(req, res, next) {
	var id = req.form.id;
	var newName = req.body;

	var newForm = req.form.template;
	newForm.title = newName;
	forms.add(req.user.id, newForm)
		.then(result => {
			if(result) {
				res.json({
					index: result.id, 
					id: forms.encode(result.id) 
				});
			}
		})
		['catch'](next);
}


// delete the form with all responses
exports.delete = function(req, res, next) {
	var id = req.form.id;

	forms.delete(id)
		.then(result => { res.sendStatus(200); })
		.catch(next);
}


// send the form (make it available for filling)
exports.send = function(req, res, next) {
	var body = JSON.parse(req.body);
	// determine fields that should be updated
	var options = { sent: new Date() }
	if(body.allowrefill) options.allowrefill = true;
	options.expires = body.expires? body.expires : null;

	forms.update(req.form.id, options)
		.then(result => res.sendStatus(200))
		.catch(next);
}