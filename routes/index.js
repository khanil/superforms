var fs = require('fs');
var path = require('path');
// var multer = require('multer');
var config = require('../config');
// middlewares
var checkAuth = require('../middleware/checkAuth');
var checkNotAuth = require('../middleware/checkNotAuth');
var isAdmin = require('../middleware/isAdmin');
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
// logger
var logger = require('../libs/logger');

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

	app.get('/confirm_registration/:token', checkNotAuth, users.confirmRegistration);
	app.get('/signout', users.signOut);
	app.get('/users', loadData, checkAuth, isAdmin, (req, res) => { res.render('users') } );

	app.get('/', loadData, require('./main.js').get);
	
	// app.post('/forms/uploadfiles', loadData, checkAuth, 
	// 	upload.array('files', config.get('multer:maxCount')), forms.uploadFiles);
	app.get('/forms', loadData, checkAuth, forms.sendFormsPage)
	app.get('/journal', loadData, checkAuth, isAdmin, forms.sendJournalPage);
	app.get('/forms/new', loadData, checkAuth, forms.sendGeneratorPage);// get form's generator page
	app.get('/forms/:id/edit', loadData, checkAuth, checkFormByAuthor, forms.sendEditPage);// send form's edit page for author
	app.get('/forms/:id/preview', loadData, checkAuth, checkFormByAuthor, forms.sendPreviewPage);
	app.get('/forms/:id', loadData, permissionToFill, forms.sendInterviewPage);// send 'interview' page
	app.get('/success', loadData, (req, res, next) => { 
		res.render('message', {
			isUser: !!req.user,
			isAdmin: req.user? req.user.role === 'admin' : false,
			title: 'Спасибо за Ваш ответ!', 
			text: 'Форма успешно заполнена.'
		})
	})
	app.get('/forms/:id/responses', loadData, checkAuth, checkFormByAuthor, responses.sendResponsesPage);//send responses page
	app.get('/forms/:id/responses/:response_id', loadData, checkAuth,
		checkFormByAuthor, checkResponseByForm, responses.sendResponsePage);//get one response by id 
	app.get('/forms/:id/reports', loadData, checkAuth, checkFormByAuthor, reports.getAllByForm);//get all reports by form id



	// For XMLHttpRequest
	app.put('/api/signin', checkNotAuth, users.sendSignInSalt)
	app.post('/api/signin', checkNotAuth, users.signIn);

	app.get('/api/users', loadData, checkAuth, isAdmin, users.getAll);
	app.get('/api/users/signup', loadData, checkAuth, isAdmin, users.sendSignUpSalt)
	app.post('/api/users/signup', loadData, checkAuth, isAdmin, users.signUp)

	app.get('/api/forms', loadData, checkAuth, forms.getAllForUser);//get all forms
	app.get('/api/journal', loadData, checkAuth, forms.getAllForOrg);//get all forms  
	app.post('/api/forms', loadData, checkAuth, forms.save);//save form's template

	app.get('/api/forms/:id', loadData, forms.getOne);//get form's template in JSON 
	app.post('/api/forms/:id/copy', loadData, checkAuth, checkFormByAuthor, forms.copy);//copy form's template
	app.post('/api/forms/:id/update', loadData, checkAuth, checkFormByAuthor, forms.update);//update form's template
	app.delete('/api/forms/:id/delete', loadData, checkAuth, checkFormByAuthor, forms.delete);
	app.post('/api/forms/:id/send', loadData, checkAuth, checkFormByAuthor, forms.send);


	app.get('/api/forms/:id/responses', loadData,  checkAuth, checkFormByAuthor, responses.getAll);//get all responses
	app.get('/api/forms/:id/responses/xlsx', loadData, checkAuth, checkFormByAuthor, responses.getXlsx);//get all responses
	app.get('/api/forms/:id/responses/:response_id', loadData, checkAuth, 
		checkFormByAuthor, checkResponseByForm, responses.getOne);//get one response by id 
	app.post('/api/forms/:id/responses', loadData, permissionToFill, responses.save);//save interview (filled form) 
	app.post('/api/forms/:id/reports', loadData, checkAuth, checkFormByAuthor, reports.save);//save report

}