var users = require('../models/user');
var forms = require('../models/form.js');
var responses = require('../models/response.js');
var HttpError = require('../error').HttpError;

var models = {
	user : require('../models/user'),
	form : require('../models/form.js'),
	response : require('../models/response.js')
	// report : require('../models/reports.js')
}


module.exports = function(req, res, next) {
	var queries = [];
	var modelsNames = [];
	determineQueriesAndModels(req, queries, modelsNames);
	req.user = null;

	Promise.all( queries.map( findOne => { return findOne() }) )
		.then(result => {
			modelsNames.forEach( (name, i) => {
				req[name] = result[i];
			})
			next();
		})
		['catch'](next);

};

// determine models which search will be in
function determineQueriesAndModels (req, queries, modelsNames) {
	var id;
	
	Object.keys(models).forEach( key => {
		id = models[key].getID(key === 'user'? req.session : req.params);
		if(id) {
			queries.push(models[key].findOne.bind(null, id));
			modelsNames.push(key);
		}
	})
}