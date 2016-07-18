var forms = require('../models/form');
var responses = require('../models/response');
var HttpError = require('../error').HttpError;
var conversion = require('../libs/conversion');

var path = require('path');

exports.save = function(req, res, next) {
	var interview = req.body;
	
	responses.add(interview, req.form.id)
		.then(result => {
			if(result) {
				if(!req.form.allowrefill) {
					if(!req.session.completedForms){
						req.session.completedForms = [];
					}
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
		response_id: req.params.response_id
	});
}


exports.sendResponsesPage = function(req, res, next) {
	res.render('responses', { id: req.params.id });
};


exports.toCSV = function (req, res, next) {
	responses.findAll(req.form.id)
		.then(result => {
			if(result) {
				var form = req.form.json;
				var dateFields = [];
				var allResponses = {
					name : form.name,
					// description : form.description,
					head : form.questions.map(question => {
							if(question.type === 'date')
								dateFields.push(question.title);
							return question.title;
						})
				}

				allResponses.body = result.map(responseRow => {
					return allResponses.head.map(question => {
						return (!~dateFields.indexOf(question)) ?
							responseRow.json[question] :
							(new Date(responseRow.json[question])).toLocaleString('ru', options);
					}) 
				})
				var csv = conversion.json2csv(allResponses);
				res.send(csv);
			}
		})
}


exports.getOne = function(req, res, next) {
	var response = new responses.JsonForClient(req.response);
	res.send(response);
}


exports.getAll = function(req, res, next) {
	var data = {};
	data.form = new forms.JsonForClient(req.form, true);

	responses.findAll(req.form.id)
		.then(result => {
			if(result) {
				data.responses = [];
				for(i = 0; i < result.length; i++) {
					data.responses[i] = result[i].json;
					data.responses[i].id = responses.getHash(result[i].id);
				}
				res.json(data);
			}
		})
		['catch'](next);
}


var options = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  timezone: 'UTC',
};