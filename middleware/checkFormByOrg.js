var HttpError = require('../error').HttpError;
var users = require('../models/user.js')


module.exports = function(req, res, next) {
	if(!req.form)
		return next(new HttpError(404, 'Запрашиваемая форма не найдена.'));
	// check user
	var role = req.user.role;
	if(role === 'admin' || role === 'root' || req.user.id === req.form.user_id) {
		next()
	} else {
		users.findOne(req.form.user_id)
			.then(foundUser => {
				req.user.org_id === foundUser.org_id?
					next() : next(new HttpError(403, "Нет доступа."))
			})
			.catch(next)
	}
}