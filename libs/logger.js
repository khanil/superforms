var winston = require('winston');

var path = require('path');

module.exports = new (winston.Logger)({
	levels: {
		'info': 0,
		'httpError': 1,
		'error': 2
	},
	colors: { 
		'info': 'green',
		'httpError': 'yellow',
		'error': 'red' 
	},
	transports: [
		new (winston.transports.Console)({ level:'info', colorize: true} ),
		new (require('winston-daily-rotate-file'))({ 
			level: 'error', 
			filename: path.join('logs', 'errors.log'), 
			datePattern: 'yy-MM-dd' 
		})
	]
});