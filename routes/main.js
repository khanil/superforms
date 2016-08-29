var path = require('path');

exports.get = function (req, res, next) {
	(req.user) ?
		res.render('forms', { isAdmin: req.user.role === 'admin'}) :
		res.render('signin');
};