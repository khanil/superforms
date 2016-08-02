var winston = require('winston');

var path = require('path');

module.exports = new (winston.Logger)({
	levels: {
		'INFO': 0,
		'WARN': 1,
		'ERROR': 2
	},
	colors: { 
		'INFO': 'green',
		'WARN': 'yellow',
		'ERROR': 'red' 
	},
	transports: [
		new (winston.transports.Console)({ level:'ERROR', colorize: true} ),
		new (require('winston-daily-rotate-file'))({
			timestamp: function() {
				return new Date();
			}, 
			level: 'ERROR', 
			filename: path.join('logs', 'errors.log'), 
			datePattern: 'yy-MM-dd' 
		})
	]
});