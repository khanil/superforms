var logger = require('../libs/logger');

module.exports = (req, res, next) => {
	var urlBegin = req.url.substring(0, 7);
	if(urlBegin !== '/styles' && urlBegin !== '/script' && urlBegin !== '/fonts/' && urlBegin !== '/favico') {
		var xhr = res.req.headers['x-requested-with'] === 'XMLHttpRequest';
		logger.INFO((xhr? 'XHR ' : '') + req.method, 'URL:', req.url, 'TIME:', new Date());
		if(req.method === 'POST')
			logger.INFO('REQUEST BODY: ', req.body)
	}
	next()
}