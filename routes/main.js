var path = require('path');

exports.get = function (req, res, next) {
	(req.user) ?
		res.redirect('/forms') :
		res.render('signin');
};