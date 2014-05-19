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
			admin_email: options.SendMailTo,
			project_name: options.ProjectName,
			from: options.email.user
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
					from: opts.from,
					to: opts.admin_email,
					subject: 'Отзыв на ' + opts.project_name,
					attachment: [
						{
							data: "<html>" + 
										" <body>" + 
										"  <p><b>date</b>: " + feedback.date + "</p>" +
										"  <p><b>email</b>: " + feedback.email + "</p>" + 
										"  <p><b>text</b>: " + feedback.body + "</p>" +
										" </body>" + 
										"</html>",
							alternative: true
						}
					]
				};
				email.send( message, function (e, message) {
					if (e) {
						// Письмо не отослано. Откатываем создание отзыва в базе данных
						feedback.remove();
						// Возвращаем ошибку
						cb(e);
						// Консоль
					} else {
						cb(null, feedback);
					}
				})
			}
		}) 
	}
}