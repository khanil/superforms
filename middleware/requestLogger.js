const logger = require('../libs/logger');
const userAgent = require('ua-parser');

module.exports = (req, res, next) => {

	const repeatedReqURL = req.session.repeatedRequests;
	// console.log(repeatedReqURL);
	if(repeatedReqURL !== req.url) {
		const urlBegin = req.url.substring(0, 7);
		if(urlBegin !== '/styles' && urlBegin !== '/script' 
		&& urlBegin !== '/fonts/' && urlBegin !== '/favico') {

			Object.assign(req, userAgent.parse(req.headers['user-agent']))
			let log = {
				ip: req.connection.remoteAddress,
				session: req.sessionID,
				user: req.session.user,
				method: req.method,
				url: req.url,
				ua: req.ua.toString(),
				os: req.os.toString(),
				// device: req.device.family
			}
			if(~req.url.search(/\/api\/forms\/.+\/responses/)) {
				req.session.repeatedReqURL = req.url;
				log.message = 'first request';
			} else if(repeatedReqURL) {
				logger.info('last request', { 
					session: req.sessionID,	
					url: repeatedReqURL
				});
				delete req.session.repeatedReqURL;
			}

			if(req.headers['x-requested-with']) log.xhr = true;
			// it works while Content-Type is text/plain
			if(typeof(req.body) == 'string') {
				log.body = req.body
			};
			logger.info(log);
		}
	}

	next();
}