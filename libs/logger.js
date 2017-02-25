var winston = require('winston');

var path = require('path');

module.exports = new (winston.Logger)({
	levels: {
		'info': 2,
		'warn': 1,
		'error': 0
	},
	colors: { 
		'info': 'green',
		'warn': 'yellow',
		'error': 'red' 
	},
	transports: [
		new (winston.transports.Console)({
			level:'info', 
			colorize: true, 
		}),
		new (require('winston-daily-rotate-file'))({
			// timestamp: () => new Date(), 
			level: 'info', 
			filename: path.join('logs', 'errors.log'), 
			datePattern: 'yy-MM-dd' 
		})
	]
});