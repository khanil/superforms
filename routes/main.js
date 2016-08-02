var path = require('path');

exports.get = function (req, res, next) {
	console.log('main starts: ', new Date())
	res.render(req.session.user ? 'main' : 'signin-up');
	console.log('main ends: ', new Date())
};