var path = require('path');
var config = require(__dirname + '/config');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var pg = require('pg');
var session = require('express-session')
var pgSession = require('connect-pg-simple')(session);
var HttpError = require(__dirname + '/error').HttpError;
var errorHandler = require(__dirname + '/error').errorHandler;
var winston = require('winston')
var app = express();
var logger = require('./libs/logger');


//create db
require(__dirname + '/models/db').create();


app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(require('./middleware/sendHttpError'));

app.use(bodyParser.text());
// app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieParser());

// sessions tweak
var sessOptions = config.get('session');
sessOptions.store = new pgSession({
    pg : pg,                                 
    conString : config.get('pg:url'),
    tableName : 'sessions'           
})

app.use(session(sessOptions));

require(__dirname + '/routes')(app);
app.use('/', express.static(path.join(__dirname, 'public')));
app.use(errorHandler);

app.listen(config.get('port'), function () {
  logger.log('INFO', 'Express server is listening on port ' + config.get('port'));
});

