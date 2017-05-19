var config = require('../config');
var forms = require('../models/form');
var HttpError = require('../error').HttpError;
var mailer = require('../libs/mailer')
var users = require('../models/user');

import React from 'react';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';

import configureStore from '../../super-forms-client/app/redux/create';
import rootReducer from '../../super-forms-client/app/forms-app/reducer';
import FormsListApp from '../../super-forms-client/app/forms-app/components';
import formsLists from '../../super-forms-client/app/forms-app/modules/formsLists';
import entities from '../../super-forms-client/app/forms-app/modules/entities';

/*
Sending of HTML pages
*/

exports.sendFormsPage = (req, res, next) => {
	const session = {
		user: req.session.user,
		activeTab: req.session.defaultTab || "org",
	};

	const store = configureStore(rootReducer, {
		session
	});

	store.dispatch(
		entities.actions.add({
			users: {
				[req.session.user]: {
					user_id: req.session.user,
					name: req.user.name,
					surname: req.user.surname,
					patronymic: req.user.patronymic,
					author: `${req.user.surname} ${req.user.name[0]}.${req.user.patronymic? req.user.patronymic[0] + '.' : ''}`
				}
			}
		})
	);

	forms.findAllForOrg(req.user.org_id)
		.then(foundForms => {
			for(let i = 0; i < foundForms.length; i++) {
				forms.modifyForJournal(foundForms[i])
			}

			store.dispatch(
				formsLists.actions.init("org", foundForms)
			);
		})
		.then(() => {
			return forms.findAllForUser(req.user.id);
		})
		.then(foundForms => {
			for(let i = 0; i < foundForms.length; i++) {
				Object.assign(foundForms[i], {
					name: req.user.name,
					surname: req.user.surname,
					patronymic: req.user.patronymic,
					user_id: req.user.id
				});
				forms.modifyForJournal(foundForms[i])
			}

			store.dispatch(
				formsLists.actions.init("personal", foundForms)
			);
		})
		.then(() => {
			const html = renderToString(
				<Provider store={store}>
					<FormsListApp />
				</Provider>
			);

			res.render('forms', {
				html,
				preloadedState: store.getState()
			});
		})
		['catch'](next);
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
				console.log(result);
				console.log(newForm);
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