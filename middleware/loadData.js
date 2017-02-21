var users = require('../models/user');
var forms = require('../models/form.js');
var responses = require('../models/response.js');
var HttpError = require('../error').HttpError;
// logger
var logger = require('../libs/logger');

var models = [
	require('../models/user'),
	require('../models/form.js'),
	require('../models/response.js')
]

// load all required data to 'req' object
module.exports = function(req, res, next) {
	console.log(req.body);

	if(req.session.user) {
		req.params.user_id = req.session.user;
	}
	// determine models which data search will be in
	var requiredModels = models.filter( model => { 
		return model.decode(req.params) 
	})
	// async search the database
	Promise.all(requiredModels.map( model => {
				return model.findOne( model.decode(req.params) ) 
			})
		) // write found results into 'req' object with corresponding model names
		.then(result => {
			let requiredDataString = 'REQUIRED DATA: ';
			
			requiredModels.forEach( (model, i) => {
				let modelName = model.constructor.name.toLowerCase()
				req[modelName] = result[i];
				requiredDataString += modelName + ': ' + (result[i]? 
					result[i].id : 'NOT FOUND'
				) + '; ';
			})

			logger.INFO(requiredDataString);
			next();
		})
		['catch'](next);

}