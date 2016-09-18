module.exports = function(req, res, next) {

	res.sendHttpError = function(err) {

		res.status(err.status);
		if (res.req.headers['x-requested-with'] === 'XMLHttpRequest') {
			res.status(err.status).send(err.message);
		} else {
			res.render("error", { 
				error: err, 
				isUser: !!req.user,
				isAdmin: req.user? req.user.role === 'admin' : false
			});
		}
	};

	next();

};