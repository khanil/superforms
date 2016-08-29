var HttpError = require('../error').HttpError;
var forms = require('../models/form.js');


module.exports = function(req, res, next) {
	if( !(req.form && req.form.sent) )
		return next(new HttpError(404, 'Запрашиваемая форма не найдена.'));

	if(req.session.completedForms)
		if(!!~req.session.completedForms.indexOf(req.params.id))
			return next(new HttpError(400, 'Вы уже заполняли данную форму.'));

	if(req.form.expires)
		if(Date.now() > new Date(req.form.expires).getTime()) 
			return next(new HttpError(403, 'Срок приема ответов уже завершен.'));
	
	next();
}