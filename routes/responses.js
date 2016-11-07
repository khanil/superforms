var forms = require('../models/form');
var responses = require('../models/response');
var HttpError = require('../error').HttpError;
var jsonToXlsx = require('../libs/jsonToXlsx');

var path = require('path');

exports.save = function(req, res, next) {
	var interview = req.body;
	
	responses.add(interview, req.form.id)
		.then(result => {
			if(result) {
				if(!req.form.allowrefill) {
					req.session.completedForms = req.session.completedForms || [];
					req.session.completedForms.push(req.params.id);
				}
				res.sendStatus(200);
			}
		})
		['catch'](next);
	
};


exports.sendResponsePage = function(req, res, next) {
	res.render('response', { 
		id: req.params.id, 
		response_id: req.params.response_id,
		isAdmin: req.user.role === 'admin'
	});
}


exports.sendResponsesPage = function(req, res, next) {
	res.render('responses', { isAdmin: req.user.role === 'admin', id: req.params.id });
};


exports.getXlsx = function (req, res, next) {
	const form = req.form.template;
	return responses.getResponsesList(req.form.id)
		.then(result => {
			if(result) {
				return {
					name : form.title,
					description : form.description,
					questions : getQuestionsFromTemplate(form.items),
					responses : result
				}
			}
		})
		.then(table => jsonToXlsx(table))
		.then(xls => {
			res.setHeader('Content-Type', 'application/vnd.openxmlformats');
			res.setHeader("Content-Disposition", "attachment; filename=" + "report.xlsx");
			res.end(xls, 'binary');
		}) 
		['catch'](next)
}

// get question titles from the form template (except files)
function getQuestionsFromTemplate(items) {
	questions = [];
	for(var i = 0; i < items.length; i++) {
		if(items[i]._type === 'question' || items[i]._type === 'delimeter') {
			questions.push(items[i])
		}
	}
	return questions;
}


exports.getOne = function(req, res, next) {
	res.send({
		form: forms.modifyForClient(req.form),
		response: responses.modifyForClient(req.response)
	});
}


exports.getAll = function(req, res, next) {

	responses.findAll(req.form.id)
		.then(foundResponses => {
			for(i = 0; i < foundResponses.length; i++) {
				responses.modifyForClient(foundResponses[i]);
			}
			res.json({
				form: forms.modifyForClient(req.form),
				responses: foundResponses
			});
		})
		['catch'](next);
}


var options = {
	year: 'numeric',
	month: 'numeric',
	day: 'numeric',
	timezone: 'UTC',
};