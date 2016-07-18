var HttpError = require('../error').HttpError;
var forms = require('../models/form.js');


module.exports = function(req, res, next) {
	if(!req.form)
		return next(new HttpError(404, 'Данная форма не найдена.'));

	if(req.session.completedForms)
		if(!!~req.session.completedForms.indexOf(req.params.id))
			return next(new HttpError(400, 'Вы уже заполняли данную форму.'));

	if(req.form.expiredate)
		if(Date.now() > new Date(req.form.expiredate).getTime()) 
			return next(new HttpError(403, 'Срок приема ответов уже завершен.'));
	
	next();
}