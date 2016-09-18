var HttpError = require('../error').HttpError;
var forms = require('../models/form.js');


module.exports = function(req, res, next) {
	if( !(req.form && req.form.sent) )
		return next(new HttpError(404, 'Запрашиваемая форма не найдена.'));

	if(req.session.completedForms)
		if(!!~req.session.completedForms.indexOf(req.params.id))
			return res.render('message', { title: 'Спасибо за Ваш ответ!', text: 'Вы уже заполнили данную форму.'} )
			// return next(new HttpError(400, 'Вы уже заполняли данную форму.'));

	if(req.form.expires)
		if(Date.now() > new Date(req.form.expires).getTime()) 
			return res.render('message', {
				isUser: !!req.user,
				title: 'Извините, срок приема ответов уже завершен.', 
				text: 'Пожалуйста, свяжитесь с автором формы.'
			})
			// return next(new HttpError(403, 'Срок приема ответов уже завершен.'));
	
	next();
}