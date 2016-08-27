var path = require('path');

exports.get = function (req, res, next) {
	res.render(req.session.user ? 'main' : 'signin');
};