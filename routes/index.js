var fs = require('fs');
var path = require('path');
var multer = require('multer');
var config = require('../config');
// middlewares
var checkAuth = require('../middleware/checkAuth');
var checkNotAuth = require('../middleware/checkNotAuth');
var permissionToFill = require('../middleware/permissionToFill');
var checkFormByAuthor = require('../middleware/checkFormByAuthor');// find the form and compare user id with user id from session
var checkResponseByForm = require('../middleware/checkResponseByForm');
// models
require('../models/db.js');
var users = require('./users.js');
var forms = require('./forms.js');
var responses = require('./responses.js');
var reports = require('./reports');
var loadData = require('../middleware/loadData');


// var upload = multer({ 
// 	storage: multer.diskStorage({
// 		destination: config.get('multer:destination'),
// 		filename: function (req, file, cb) {
// 			console.log(file)
// 			cb(null, file.fieldname + '-' + Date.now())
// 		}
// 	})//,
// 	//limits: config.get('multer:limits')
// })


module.exports = function (app) {
	app.use( (req, res, next) => {
		console.log(req.url, req.method, new Date());
		next()
	})
	
	// app.get('/test', (req, res, next) => { res.render('test') } )
	// app.get('/post', (req, res, next) => {
	// 	var string = req.body
	// 	var regex = /^data:.+\/(.+);base64,(.*)$/;

	// 	var matches = string.match(regex);
	// 	var ext = matches[1];
	// 	var data = matches[2];
	// 	var buffer = new Buffer(data, 'base64');
	// 	fs.writeFileSync('data.' + ext, buffer);
	// 	res.sendStatus(200) 
	// } )

	// app.get('/user/confirm_registration/:confirm_id', loadData, users.confirmRegistration);
	app.post('/signin', checkNotAuth, users.signIn);
	app.get('/signout', users.signOut);
	app.get('/users', loadData, checkAuth, (req, res) => { res.render('users') } );
	app.get('/api/users', loadData, checkAuth, users.getAll);
	app.post('/users/new', loadData, checkAuth, users.signUp)

	app.get('/', require('./main.js').get);
	
	// app.post('/forms/uploadfiles', loadData, checkAuth, 
	// 	upload.array('files', config.get('multer:maxCount')), forms.uploadFiles);
	app.get('/forms/new', loadData, checkAuth, forms.sendGeneratorPage);// get form's generator page
	app.get('/forms/:id/edit', loadData, checkFormByAuthor, forms.sendEditPage);// send form's edit page for author
	app.get('/forms/:id/preview', loadData, checkFormByAuthor, forms.sendPreviewPage);
	app.get('/forms/:id', loadData, permissionToFill, forms.sendInterviewPage);// send 'interview' page
	app.get('/forms/:id/responses', loadData, checkFormByAuthor, responses.sendResponsesPage);//send responses page
	app.get('/forms/:id/responses/:response_id', loadData, 
		checkFormByAuthor, checkResponseByForm, responses.sendResponsePage);//get one response by id 
	app.get('/forms/:id/reports', loadData, checkFormByAuthor, reports.getAllByForm);//get all reports by form id


	// For XMLHttpRequest
	app.get('/api/forms', loadData, checkAuth, forms.getAll);//get all forms 
	app.post('/api/forms', loadData, checkAuth, forms.save);//save form's template

	app.get('/api/forms/:id', loadData, forms.getOne);//get form's template in JSON 
	app.post('/api/forms/:id/copy', loadData, checkFormByAuthor, forms.copy);//copy form's template
	app.post('/api/forms/:id/update', loadData, checkFormByAuthor, forms.update);//update form's template
	app.delete('/api/forms/:id/delete', loadData, checkFormByAuthor, forms.delete);
	app.post('/api/forms/:id/send', loadData, checkFormByAuthor, forms.send);


	app.get('/api/forms/:id/responses', loadData, checkFormByAuthor, responses.getAll);//get all responses
	app.get('/api/forms/:id/responses/xlsx', loadData, checkFormByAuthor, responses.getXlsx);//get all responses
	app.get('/api/forms/:id/responses/:response_id', loadData, 
		checkFormByAuthor, checkResponseByForm, responses.getOne);//get one response by id 
	app.post('/api/forms/:id/responses', loadData, permissionToFill, responses.save);//save interview (filled form) 
	app.post('/api/forms/:id/reports', loadData, checkFormByAuthor, reports.save);//save report

}