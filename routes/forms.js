var config = require('../config');
var forms = require('../models/form');
var HttpError = require('../error').HttpError;
var mailer = require('../libs/mailer')


exports.sendFormsPage = (req, res) => {
	res.render('forms', { isAdmin: req.user.role === 'admin'}) 
}

exports.sendGeneratorPage = function (req, res) {
	res.render('generation&edit', { 
		title: 'Создание формы',
		page: 'Главная',
		type: 'CREATE_FORM',
		id: 'id',
		isAdmin: req.user.role === 'admin'
	});
};

exports.sendEditPage = function(req, res, next) {
	res.render('generation&edit', { 
		title: 'Редактирование формы',
		type: 'EDIT_FORM',
		id: req.params.id,
		isUser: !!req.user,
		isAdmin: req.user.role === 'admin'
	});
}

exports.sendPreviewPage = function(req, res, next) {
	res.render('preview', { id: req.params.id, isAdmin: req.user.role === 'admin' });
}


exports.sendInterviewPage = function(req, res, next) {
	res.render('interview', { id: req.params.id,
		isUser: !!req.user,
		isAdmin: req.user? req.user.role === 'admin' : false
	});
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
	var newName = req.body;

	var newForm = req.form.template;
	newForm.title = newName;
	forms.add(req.user.id, newForm)
		.then(result => {
			if(result) {
				res.send( forms.getHash(result.id) );
			}
		})
		['catch'](next);
}


exports.uploadFiles = (req, res, next) => {
	console.log(req.body)
	res.json(req.files);
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
	var options = JSON.parse(req.body);
	Promise.resolve()
		.then( () => {
			if(options.recipients) {
				options.hash = req.params.id;
				return mailer.send(options)
			}
		})
		.then( () => {
			['hash', 'recipients', 'topic', 'message'].forEach(key => delete(options[key]))
			options.id = req.form.id;
			options.sent = new Date();
			console.log(options)
			forms.update(req.form.id, options)
		})
		.then( () => {
			
		})
		.then(result => {
				res.sendStatus(200);
			})
		['catch'](next);
}


exports.getOne = function(req, res, next) {
	
	res.json( forms.modifyForClient(req.form) );
}


exports.getAll = function(req, res, next) {
	forms.findAll(req.user.id)
		.then(foundForms => {
			if(foundForms) {
				for(let i = 0; i < foundForms.length; i++) {
					forms.modifyForClient(foundForms[i])
				}
				res.json(foundForms);
			} else {
				throw new HttpError(404, 'Данная форма не найдена.');
			}
		})
		['catch'](next);
}