var path = require('path');

exports.get = function (req, res, next) {
	if(req.session.user) {
		res.render('main');
		// res.sendFile(path.join(__dirname, '../public/views/main.html'));
	} else {
		res.redirect('/user#signin');
	}
};