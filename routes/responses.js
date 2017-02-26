var config = require('../config');
var forms = require('../models/form');
var responses = require('../models/response');
var HttpError = require('../error').HttpError;
var excelExport = require('../libs/excel-export');

const subscribers = {};

exports.save = (req, res, next) => {
	// it works while Content-Type is text/plain
	if(typeof(req.body) !== 'string') {
		throw new HttpError(400, 'Во время отправки ответов произошла ошибка. '
			+ 'Возможно, Вы используете устаревшую версию бразера. '
			+ 'Для корректной работы приложения его необходимо обновить. '
			+ 'Если же версия браузера актуальна, пожалуйста, свяжитесь с техподдержкой.');
	}
	responses.add(req.body, req.form.id)
		.then(result => {
			if(!req.form.allowrefill) {
				req.session.completedForms = req.session.completedForms || [];
				req.session.completedForms.push(req.params.id);
			}
			res.sendStatus(200);
			sendNewResponses(req.form.id, [ result ]);
		})
		.catch(next);
};


exports.sendResponsePage = (req, res, next) => {
	res.render('response', {
		isAdmin: req.user.role === 'admin', 
		user_id: req.params.user_id,
		form_id: req.params.id, 
		response_id: req.params.response_id,
	});
}


import renderReactHTML from '../libs/renderReactHTML';

exports.sendResponsesPage = function(req, res, next) {
	responses.findAll(req.form.id)
		.then(foundResponses => {
			for(let i = 0; i < foundResponses.length; i++) {
				responses.modifyForClient(foundResponses[i]);
			}
			
			const preloadedState = {
				form: forms.modifyForClient(req.form),
				responses: {
					entities: foundResponses,
					fetchedLast: Date.now()
				}
			};
			
			const html = renderReactHTML(preloadedState);

			res.render('responses', {
				html,
				preloadedState
			});
		})
		['catch'](next);
};


exports.getXlsx = (req, res, next) => {
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


function generateHeader(form, responsesList) {
	const {title, items} = form;
	let columns = [{ title: 'Получено' }], currSection = columns, question;

	for(let i = 0; i < items.length; i++) {
		if(items[i]._type === 'delimeter') {
			let newSection = { title: items[i].title, columns: [] };
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


function generateBody(questions, responses) {
	let colsOpts = [{ type: 'datetime' }], // type and cell data handler function of each column
		rows = responses.map(response => [ response.received ]),
		body = { rows, colsOpts },
		delCount = 0;
	console.log(rows)
	for(let col = 0; col < questions.length; col++) {
		if(questions[col]._type === 'question') {
			if(questions[col].multiple === 'true') {
				addQuestionOptions(body, responses, questions[col].options, col - delCount);
			} else {
				for(var row = 0; row < responses.length; row++) {
					rows[row].push(responses[row].list[col - delCount])
				}
				colsOpts.push(exportOpts[questions[col].type]);
			}
		} else if(questions[col]._type === 'delimeter' 
		|| questions[col]._type === 'image') {
			++delCount;
		}
	}
	return body;
}


function addQuestionOptions(body, responses, options, colNum) {
	const {rows, colsOpts} = body;
	// for each option of multiple select
	for(let i = 0; i < options.length; i++) {
		for(let row = 0; row < responses.length; row++) {
			selectedOpts = responses[row].list[colNum]
			cellData = selectedOpts && ~selectedOpts.indexOf(options[i]) ?
				options[i] : '';

			rows[row].push(cellData);
		}
		colsOpts.push(exportOpts['string']);
	}
}


const exportOpts = {
	integer: { type: 'number' },
	float: { type: 'number', processBeforeWrite: floatToNumber },
	financial: { type: 'number', processBeforeWrite: floatToNumber },
	string: { type: 'string', processBeforeWrite: stringToNumber },
	select: { type: 'string', processBeforeWrite: stringToNumber },
	paragraph: { type: 'string', processBeforeWrite: stringToNumber },
	datetime: { type: 'datetime' },
	date: { type: 'date' },
	time: { type: 'time' }
}


function stringToNumber(cellData, cellOpts) {
	if(cellData === '' || typeof cellData !== 'string') return '';
	if(!~cellData.search(/[^\d,.]/)) {
		const num = +cellData || +cellData.replace(/,/, '.');
		if(!isNaN(num)) {
			cellOpts.type = 'number';
			return num;
		}
	}
	return cellData;
}


function floatToNumber(cellData) {
	if(typeof cellData === 'string') { // the float or financial type
		return cellData.replace(/,/, '.')
	}
}	



exports.getOne = (req, res, next) => {
	res.send({
		form: forms.modifyForClient(req.form),
		response: responses.modifyForClient(req.response)
	});
}


exports.getAll = (req, res, next) => {
	responses.findAll(req.form.id)
		.then(foundResponses => {
			for(let i = 0; i < foundResponses.length; i++) {
				responses.modifyForClient(foundResponses[i]);
			}
			res.json(foundResponses);
		})
		['catch'](next);
}


exports.updateResponses = (req, res, next) => {
	if(!req.form)
		return next(new HttpError(404, 'Запрашиваемая форма не найдена.'));
	
	responses.findAll(req.form.id)
		.then(foundResponses => {
			const diff = foundResponses.length - req.params.amount;
			if(diff) {
				foundResponses.length = diff;
				console.log(foundResponses);
				res.json(foundResponses);
			} else {
				subscribe(req, res);
			}
		})
		.catch(next);
}


function subscribe(req, res) {
	res.setHeader("Cache-Control", "no-cache, must-revalidate");
	req.timestamp = Date.now();
	console.log('add subscriber\nform: ', req.form.id, '\nreq: ', req.timestamp);
	if(subscribers[req.form.id]) {
		subscribers[req.form.id][req.timestamp] = res;
	} else {
		subscribers[req.form.id] = { [req.timestamp]: res };
	}

	req.on('close', function() {
		delete subscribers[req.form.id][req.timestamp];
		console.log('delete subscriber\nform: ', req.form.id, '\nreq: ', req.timestamp);
	});
}

function sendNewResponses(formID, newResponse) {
	console.log(subscribers)
	const onForm = subscribers[formID];
	delete subscribers[formID];
	for(var key in onForm) {
		onForm[key].json(newResponse);
	}
}

