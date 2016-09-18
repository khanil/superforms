var path = require('path');

exports.get = function (req, res, next) {
	req.user?
		res.redirect('/forms') :
		require('../routes/users').sendSignInPage(req, res)
};