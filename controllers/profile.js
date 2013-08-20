'use strict';

var fs = require('fs'),
	path = require('path'),
	mkdirp = require('mkdirp'),
	gm = require('gm'),
	auth = require('./auth.js'),
	_session = require('./_session.js'),
	Settings,
	User,
	Utils = require('../commons/Utils.js'),
	step = require('step'),
	log4js = require('log4js'),
	_ = require('lodash'),
	logger,
	incomeDir = global.appVar.storePath + 'incoming/',
	privateDir = global.appVar.storePath + 'private/avatars/',
	publicDir = global.appVar.storePath + 'public/avatars/',
	dummyFn = function () {
	},
	msg = {
		deny: 'You do not have permission for this action'
	};

//Отдаем пользователя
function giveUser(socket, data, cb) {
	var iAm = socket.handshake.session.user,
		user,
		login = data && data.login,
		itsMe = (iAm && iAm.login) === login,
		itsOnline = false;

	if (!Utils.isType('object', data) || !login) {
		return cb({message: 'Bad params', error: true});
	}

	step(
		function () {
			var user = _session.getOnline(login);
			if (user) {
				itsOnline = true;
				this(null, user.toObject());
			} else {
				User.findOne({login: new RegExp('^' + login + '$', 'i'), active: true}, {_id: 0, pass: 0, activatedate: 0 }, {lean: true}, cb);
			}
		},
		function (err, user) {
			if (err && !user) {
				return cb({message: err.message || 'Requested user does not exist', error: true});
			}
			user.online = itsOnline;
			cb({message: 'ok', user: user});
		}
	);
}

//Сохраняем изменения в профиле пользователя
function saveUser(socket, data, cb) {
	var iAm = socket.handshake.session.user,
		login = data && data.login,
		itsMe,
		itsOnline,
		newValues;

	if (!iAm) {
		return cb({message: msg.deny, error: true});
	}
	if (!Utils.isType('object', data) || !login) {
		return cb({message: 'Bad params', error: true});
	}
	itsMe = iAm.login === login;

	if (!itsMe && iAm.role < 10) {
		return cb({message: msg.deny, error: true});
	}

	step(
		function () {
			var user = _session.getOnline(login);
			if (user) {
				itsOnline = true;
				this(null, user);
			} else {
				User.findOne({login: login}, this);
			}
		},
		function (err, user) {
			if (err && !user) {
				return cb({message: err.message || 'Requested user does not exist', error: true});
			}

			//Новые значения действительно изменяемых свойств
			newValues = Utils.diff(_.pick(data, 'firstName', 'lastName', 'birthdate', 'sex', 'country', 'city', 'work', 'www', 'icq', 'skype', 'aim', 'lj', 'flickr', 'blogger', 'aboutme'), user.toObject());
			if (_.isEmpty(newValues)) {
				return cb({message: 'Nothing to save'});
			}
			if (user.disp && user.disp !== user.login && (newValues.firstName || newValues.lastName)) {
				var f = newValues.firstName || user.firstName || '',
					l = newValues.lastName || user.lastName || '';

				user.disp = f + (f && l ? ' ' : '') + l;
			}

			_.assign(user, newValues);
			user.save(this);
		},
		function (err, user) {
			if (err) {
				return cb({message: err.message, error: true});
			}
			if (itsOnline) {
				_session.emitUser(user.login);
			}

			cb({message: 'ok', saved: 1});
		}
	);
}

//Меняем отображаемое имя
function changeDispName(socket, data, cb) {
	var iAm = socket.handshake.session.user,
		login = data && data.login,
		itsMe = (iAm && iAm.login) === login,
		itsOnline;

	if (!iAm || !itsMe && iAm.role < 10) {
		return cb({message: msg.deny, error: true});
	}
	if (!Utils.isType('object', data) || !login) {
		return cb({message: 'Bad params', error: true});
	}

	step(
		function () {
			var user = _session.getOnline(login);
			if (user) {
				itsOnline = true;
				this(null, user);
			} else {
				User.findOne({login: login}, this);
			}
		},
		function (err, user) {
			if (err && !user) {
				return cb({message: err.message || 'Requested user does not exist', error: true});
			}

			if (!!data.showName) {
				var f = user.firstName || '',
					l = user.lastName || '';
				user.disp = (f + (f && l ? ' ' : '') + l) || user.login;
			} else {
				user.disp = user.login;
			}

			user.save(this);
		},
		function (err, user) {
			if (err) {
				return cb({message: err.message, error: true});
			}
			if (itsOnline) {
				_session.emitUser(user.login);
			}
			cb({message: 'ok', saved: 1, disp: user.disp});
		}
	);
}

//Меняем email
function changeEmail(socket, data, cb) {
	var iAm = socket.handshake.session.user,
		user,
		login = data && data.login,
		itsMe = (iAm && iAm.login) === login,
		itsOnline;

	if (!iAm || !itsMe && iAm.role < 10) {
		return cb({message: msg.deny, error: true});
	}
	if (!Utils.isType('object', data) || !login || !data.email) {
		return cb({message: 'Bad params', error: true});
	}
	data.email = data.email.toLowerCase();
	if (!data.email.match(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
		return cb({message: 'Недействительный email. Проверьте корректность ввода.', error: true});
	}

	step(
		function () {
			var user = _session.getOnline(login);
			if (user) {
				itsOnline = true;
				this(null, user);
			} else {
				User.findOne({login: login}, this);
			}
		},
		function (err, u) {
			if (err && !u) {
				return cb({message: err.message || 'Requested user does not exist', error: true});
			}
			user = u;
			User.findOne({email: data.email}, {_id: 0, login: 1}, this);
		},
		function (err, u) {
			if (err) {
				return cb({message: err.message, error: true});
			}
			if (u && u.login !== user.login) {
				return cb({message: 'Такой email уже используется другим пользователем', error: true});
			}

			if (data.pass) {
				iAm.checkPass(data.pass, function (err, isMatch) {
					if (err) {
						return cb({message: err.message, error: true});
					}
					if (isMatch) {
						saveEmail();
					} else {
						cb({message: 'Неверный пароль', error: true});
					}
				});
			} else {
				cb({confirm: 'pass'});
			}
		}
	);

	function saveEmail() {
		user.email = data.email;
		user.save(function (err, savedUser) {
			if (err) {
				return cb({message: err.message, error: true});
			}
			if (itsOnline) {
				_session.emitUser(user.login);
			}
			cb({message: 'ok', email: savedUser.email});
		});
	}
}

//Меняем аватар
function changeAvatar(socket, data, cb) {
	var iAm = socket.handshake.session.user,
		user,
		login = data && data.login,
		itsMe = (iAm && iAm.login) === login,
		itsOnline,
		file,
		fullfile;

	if (!iAm || !itsMe && iAm.role < 10) {
		return cb({message: msg.deny, error: true});
	}
	if (!Utils.isType('object', data) || !login || !data.file || !new RegExp( "^[a-z0-9]{10}\\.(jpe?g|png)$", "").test(data.file)) {
		return cb({message: 'Bad params', error: true});
	}

	file = data.file;
	fullfile = file.replace(/((.)(.))/, "$2/$3/$1");

	step(
		function () {
			var user = _session.getOnline(login);
			if (user) {
				itsOnline = true;
				this(null, user);
			} else {
				User.findOne({login: login}, this);
			}
		},
		function (err, u) {
			if (err && !u) {
				return cb({message: err.message || 'Requested user does not exist', error: true});
			}
			var dirPrefix = fullfile.substr(0, 4);
			user = u;

			//Переносим файл из incoming в private
			fs.rename(incomeDir + file, path.normalize(privateDir + fullfile), this.parallel());

			//Создаем папки в public
			mkdirp(path.normalize(publicDir + 'd/' + dirPrefix), null, this.parallel());
			mkdirp(path.normalize(publicDir + 'h/' + dirPrefix), null, this.parallel());
		},
		function (err) {
			if (err) {
				return cb({message: err.message, error: true});
			}
			//Копирование 100px из private в public/d/
			Utils.copyFile(privateDir + fullfile, publicDir + 'd/' + fullfile, this.parallel());

			//Конвертация в 50px из private в public/h/
			gm(privateDir + fullfile)
				.quality(90)
				.filter('Sinc')
				.resize(50, 50)
				.write(publicDir + 'h/' + fullfile, this.parallel());
		},
		function (err) {
			if (err) {
				return cb({message: err.message, error: true});
			}

			//Удаляем текущий аватар, если он был
			var currentAvatar = user.avatar;
			if (currentAvatar) {
				fs.unlink(path.normalize(privateDir + currentAvatar), dummyFn);
				fs.unlink(path.normalize(publicDir + 'd/' + currentAvatar), dummyFn);
				fs.unlink(path.normalize(publicDir + 'h/' + currentAvatar), dummyFn);
			}

			//Присваиваем и сохраняем новый аватар
			user.avatar = fullfile;
			user.save(this);
		},
		function (err) {
			if (err) {
				return cb({message: err.message, error: true});
			}
			if (itsOnline) {
				_session.emitUser(user.login);
			}
			cb({message: 'ok', avatar: user.avatar});
		}
	);
}

//Удаляем аватар
function delAvatar(socket, data, cb) {
	var iAm = socket.handshake.session.user,
		user,
		login = data && data.login,
		itsMe = (iAm && iAm.login) === login,
		itsOnline;

	if (!iAm || !itsMe && iAm.role < 10) {
		return cb({message: msg.deny, error: true});
	}
	if (!Utils.isType('object', data) || !login) {
		return cb({message: 'Bad params', error: true});
	}

	step(
		function () {
			var user = _session.getOnline(login);
			if (user) {
				itsOnline = true;
				this(null, user);
			} else {
				User.findOne({login: login}, this);
			}
		},
		function (err, user) {
			if (err && !user) {
				return cb({message: err.message || 'Requested user does not exist', error: true});
			}

			//Удаляем текущий аватар, если он был
			var currentAvatar = user.avatar;
			if (currentAvatar) {
				fs.unlink(path.normalize(privateDir + currentAvatar), dummyFn);
				fs.unlink(path.normalize(publicDir + 'd/' + currentAvatar), dummyFn);
				fs.unlink(path.normalize(publicDir + 'h/' + currentAvatar), dummyFn);

				user.avatar = undefined;
				user.save(function (err) {
					if (err) {
						return cb({message: err.message, error: true});
					}
					if (itsOnline) {
						_session.emitUser(login);
					}
					cb({message: 'ok'});
				});
			} else {
				cb({message: 'ok'});
			}
		}

	);
}


module.exports.loadController = function (app, db, io) {
	logger = log4js.getLogger("profile.js");

	Settings = db.model('Settings');
	User = db.model('User');

	io.sockets.on('connection', function (socket) {
		var hs = socket.handshake;

		socket.on('giveUser', function (data) {
			giveUser(socket, data, function (result) {
				socket.emit('takeUser', result);
			});
		});

		socket.on('saveUser', function (data) {
			saveUser(socket, data, function (resultData) {
				socket.emit('saveUserResult', resultData);
			});
		});

		socket.on('changeDispName', function (data) {
			changeDispName(socket, data, function (resultData) {
				socket.emit('changeDispNameResult', resultData);
			});
		});
		socket.on('changeEmail', function (data) {
			changeEmail(socket, data, function (resultData) {
				socket.emit('changeEmailResult', resultData);
			});
		});

		socket.on('changeAvatar', function (data) {
			changeAvatar(socket, data, function (resultData) {
				socket.emit('changeAvatarResult', resultData);
			});
		});
		socket.on('delAvatar', function (data) {
			delAvatar(socket, data, function (resultData) {
				socket.emit('delAvatarResult', resultData);
			});
		});
	});

};