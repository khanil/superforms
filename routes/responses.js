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


exports.getXlsx = function (req, res, next) {
	return responses.getResponsesList(req.form.id)
		.then(result => {
			if(result) {
				var form = req.form.template;
				return {
					name : form.name,
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

/** get question titles from form template (except plaseholders and images)	
	and find out indexes of 'date' type questions **/
function getQuestionsFromTemplate(items) {
	questions = [];
	for(var i = 0; i < items.length; i++) {
		if(items[i]._type === 'question') {
			questions.push(items[i])
		}
	}
	// console.log(this.indexesOfDateQuestions)
	return questions;
}


// function getAllResponses(responsesRows) {
// 	responses = [];
// 	* There wiil be a lot of responses rows, so I've decided 
// 		to use 'for' instead 'forEach' because it is faster *
// 	for(var i = 0; i < responsesRows.length; i++) {
// 		responses.push(responsesRows[i].list)
// 	}
// 	return responses;
// }

exports.getOne = function(req, res, next) {
	var response = new responses.JsonForClient(req.response);
	res.send(response);
}


exports.getAll = function(req, res, next) {
	var data = {};
	
	// console.log(req.form.id)
	responses.findAll(req.form.id)
		.then(foundResponses => {
			data.responses = [];
			for(i = 0; i < foundResponses.length; i++) {
				data.responses[i] = foundResponses[i].list;
				data.responses[i].id = responses.getHash(foundResponses[i].id);
			}
			data.form = forms.modifyForClient(req.form);
			res.json(data);
		})
		['catch'](next);
}


var options = {
	year: 'numeric',
	month: 'numeric',
	day: 'numeric',
	timezone: 'UTC',
};