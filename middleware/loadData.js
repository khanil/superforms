var users = require('../models/user');
var forms = require('../models/form.js');
var responses = require('../models/response.js');
var HttpError = require('../error').HttpError;

var models = [
	require('../models/user'),
	require('../models/form.js'),
	require('../models/response.js')
	// report : require('../models/reports.js')
]

// load all required data to 'req' object
module.exports = function(req, res, next) {
	console.log('loadData starts:', new Date())
	if(req.session.user) {
		req.params.user_id = req.session.user;
	}
	// determine models which data search will be in
	var requiredModels = models.filter( model => { 
		return model.getIdFromParams(req.params) 
	})
	// async search the database
	Promise.all(requiredModels.map( model => { 
				return model.findOne( model.getIdFromParams(req.params) ) 
			})
		) // write found results into 'req' object with corresponding model names
		.then(result => {
			requiredModels.forEach( (model, i) => {
				req[model.name] = result[i];
			})
			console.log('loadData ends:', new Date())
			next();
		})
		['catch'](next);

}