var forms = require('../models/form');
var responses = require('../models/response');
var HttpError = require('../error').HttpError;
var excelExport = require('../libs/excel-export');
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
		isAdmin: req.user.role === 'admin', 
		config: {
			user_id: req.params.user_id,
			form_id: req.params.id, 
			response_id: req.params.response_id,
		}
	});
}


exports.sendResponsesPage = function(req, res, next) {
	res.render('responses', {
		isAdmin: req.user.role === 'admin',
		config: {
			user_id: req.params.user_id,
			form_id: req.params.id, 
			timeout: 3000000
		}
	});
};


exports.getXlsx = function (req, res, next) {
	const form = req.form.template;
	return responses.getResponsesList(req.form.id)
		.then(responsesList => {
			if(responsesList) {
				return excelExport.executeAsync({
					header: generateHeader(form, responsesList), 
					body: generateBody(form.items, responsesList)
				})
			}
		})
		.then(xls => {
			res.setHeader('Content-Type', 'application/vnd.openxmlformats');
			res.setHeader("Content-Disposition", "attachment; filename=" + "report.xlsx");
			res.end(xls, 'binary');
		}) 
		['catch'](next)
}


// .then(xlsx => {
// 	fs.writeFile('example.xlsx', xlsx, 'binary', err => {
// 		if (err) throw err;
// 		console.log('It\'s saved!');
// 	});
// })
// .catch(console.log)
// return {
// 	name : form.title,
// 	description : form.description,
// 	questions : getQuestionsFromTemplate(form.items),
// 	responses : result
// }

function generateHeader(form, responsesList) {
	const {title, items} = form;
	
	let columns = [], currSection = columns, question;

	for(let i = 0; i < items.length; i++) {
		if(items[i]._type === 'delimeter') {
			newSection = { title: items[i].title, columns: [] };
			columns.push(newSection);
			currSection = newSection.columns;
		} else {
			question = { title: items[i].title };
			if(items[i].multiple === 'true') {
				question.columns = items[i].options.map(opt => ({ title: opt }));
			}
			currSection.push(question);
		}
	}
	return { columns };
}


const xmlTypes = {
	integer: 'number',
	float: 'number',
	string: 'string',
	select: 'string',
	paragraph: 'string',
	datetime: 'datetime',
	date: 'date',
	time: 'time'
}


function generateBody(questions, responses) {
	let columnsOptions = [], rows = responses.map(() => []), delCount = 0;
	let body = { rows, columnsOptions };

	for(let col = 0; col < questions.length; col++) {
		if(questions[col]._type === 'question') {
			if(questions[col].multiple === 'true') {
				addQuestionOptions(body, responses, questions[col].options, col - delCount);
			} else {
				for(var row = 0; row < responses.length; row++) {
					rows[row].push(responses[row].list[col - delCount])
				}
				columnsOptions.push({ type: xmlTypes[questions[col].type] });
			}

		} else if(questions[col]._type === 'delimeter' 
		|| questions[col]._type === 'image') {
			++delCount;
		}
	}
	return body;
}


function addQuestionOptions(body, responses, options, colNum) {
	const {rows, columnsOptions} = body;
	// for each option of multiple select
	for(let i = 0; i < options.length; i++) {
		for(let row = 0; row < responses.length; row++) {
			selectedOpts = responses[row].list[colNum]
			cellData = selectedOpts && ~selectedOpts.indexOf(options[i]) ?
				options[i] : '';

			rows[row].push(cellData);
			columnsOptions.push({ type: 'string' })
		}
	}
}



// get question titles from the form template (except files)
function getQuestionsFromTemplate(items) {
	questions = [];
	for(var i = 0; i < items.length; i++) {
		if(items[i]._type === 'question' || items[i]._type === 'delimeter') {
			questions.push(items[i]);
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

const fs = require('fs')


exports.getAll = function(req, res, next) {
	responses.findAll(req.form.id)
		.then(foundResponses => {
			for(i = 0; i < foundResponses.length; i++) {
				responses.modifyForClient(foundResponses[i]);
			}
			res.json(foundResponses);
		})
		['catch'](next);
}


var options = {
	year: 'numeric',
	month: 'numeric',
	day: 'numeric',
	timezone: 'UTC',
};