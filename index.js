/*
	Функция-конструктор для модуля.
	Принимает объект с параметрами:
		mongoose: - mongoose-объект.

	Возвращает объект, через который можно управлять
	записями обратной связи.
*/

module.exports = function ( options ) {
	var email = require('emailjs');
	var model = schema ( options.mongoose );
	var server = email.server.connect( options.email );

	return {
		model: model,
		create: create({
			model: model,
			email: server,
			admin_email: options.SendEmailTo
		})
	}
}

// Функция возвращает модель записи
function schema ( mongoose ) {
	// Схема для записи обратной связи
	var schema = mongoose.Schema({
		email: String,
		body: String,
		date: {
			type: Date,
			default: Date.now()
		}
	});

	// Модель в базе данных
	var Feedbacks = mongoose.model('afeedbacks', schema);

	return Feedbacks;
}

// Функция возвращает функцию-создательницу feedback'а 
function create( opts ) {
	var email = opts.email;
	var Model = opts.model;

	return function ( options, cb ) {
		var feedback = new Model(options);

		feedback.save( function (e, feedback) {
			if (e) cb(e); else {
				var message = {
					text: feedback.body,
					from: 'user@example.com',
					to: opts.admin_email,
					subject: 'Отзыв на сайте serpteam.ru'
				}
				console.log(feedback);
				email.send( message, function (e, message) {
					if (e) cb(e); else {
						cb(null, feedback);
						console.log(message, feedback);
					}
				})
			}
		}) 
	}
}