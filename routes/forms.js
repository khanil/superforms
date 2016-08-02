var config = require('../config');
var forms = require('../models/form');
var HttpError = require('../error').HttpError;
var mailer = require('../libs/mailer')


exports.sendGeneratorPage = function (req, res) {
	res.render('generation&edit', { 
		title: 'Создание формы',
		page: 'Главная',
		type: 'CREATE_FORM',
		id: 'id'
	});
};

exports.sendEditPage = function(req, res, next) {
	res.render('generation&edit', { 
		title: 'Редактирование формы',
		type: 'EDIT_FORM',
		id: req.params.id
	});
}

exports.sendPreviewPage = function(req, res, next) {
	res.render('preview', { id: req.params.id });
}


exports.sendInterviewPage = function(req, res, next) {
	res.render('interview', { id: req.params.id });
}


exports.save = function(req, res, next) {
	forms.add(req.user.id, req.body)
		.then(result => {
			res.send(forms.getHash(result.id));
		})
		['catch'](next);
};


exports.update = function(req, res, next) {
	var id = req.form.id;
	var updatedFields = {
		template : req.body
	}
	// Если форма сохраняется в процессе создания, то дата изменения не записывается в базу
	// Используется для возможности сортировки по созданным / отредактированным / отправленным формам
	if ( req.headers.referer !== config.get('domain') + 'forms/new' ) {
		updatedFields.edited = new Date();
	}
	forms.update(id, updatedFields)
		.then(result => {
			res.sendStatus(200);
		})
		['catch'](next);
}


exports.copy = function(req, res, next) {
	var id = req.form.id;
	var newName = (JSON.parse(req.body)).name;

	var newForm = req.form.template;
	newForm.name = newName;
	forms.add(req.user.id, newForm)
		.then(result => {
			if(result) {
				res.send( forms.getHash(result.id) );
			}
		})
		['catch'](next);
}


exports.delete = function(req, res, next) {
	var id = req.form.id;

	forms.delete(id)
		.then(result => {
			var referer = req.headers.referer;
			if(referer) {
				if(!!~referer.indexOf('/forms/')) {
					res.redirect('/');
					return;
				}
			}
			res.sendStatus(200);
		})
		['catch'](next);
}


exports.send = function(req, res, next) {
	var id = req.form.id;
	var updatedFields = JSON.parse(req.body);
	updatedFields.sent = new Date();
	delete(updatedFields.id);

	if(updatedFields.recipients) {
		// отправка почтой не работает
		return next(new HttpError(500, 'Отправка почтой не поддерживается в данный момент. Пожалуйста, воспользуйтесь отправкой по ссылке.'));
	}
	// изменение статуса
	forms.update(id, updatedFields)
		.then(result => {
			res.sendStatus(200);
		})
		['catch'](next);
}


exports.getOne = function(req, res, next) {
	res.json(new forms.JsonForClient(req.form, true));
}


exports.getAll = function(req, res, next) {
	forms.findAll(req.user.id)
		.then(result => {
			if(result) {
				var formsList = [], i;
				
				for(i = 0; i < result.length; i++) {
					formsList[i] = new forms.JsonForClient( result[i] );
				}
				res.json(formsList);
			} else {
				throw new HttpError(404, 'Данная форма не найдена.');
			}
		})
		['catch'](next);
}