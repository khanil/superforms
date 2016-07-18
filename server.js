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


app.use('/', express.static(path.join(__dirname, 'public')));

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.use(require('./middleware/sendHttpError'));

app.use(bodyParser.text());
app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieParser());

app.use(session({
  store: new pgSession({
    pg : pg,                                 
    conString : config.get('pg:url'),
    tableName : 'sessions'           
  }),
  secret: config.get('session:secret'),
  resave: config.get('session:resave'),
  cookie: config.get('session:cookie'),
  saveUninitialized : config.get('session:saveUninitialized')
}));

require(__dirname + '/routes')(app);



app.use(errorHandler);

app.listen(config.get('port'), function () {
  logger.info('Express server is listening on port ' + config.get('port'));
});

