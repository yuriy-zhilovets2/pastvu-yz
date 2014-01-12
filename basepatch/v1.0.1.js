/*global, print: true, printjson: true*/
'use strict';

var log4js = require('log4js'),
	mongoose = require('mongoose'),
	logger;

module.exports.loadController = function (app, db) {
	logger = log4js.getLogger("systemjs.js");

	saveSystemJSFunc(function pastvuPatch() {
		var startTime = Date.now();

		//Расчет новых параметров регионов
		regionsCalcCenter(true);
		regionsCalcBBOX();
		regionsCalcPointsNum();
		regionsCalcPolygonsNum();

		//Назначит всем пользователям домашний регион (_id региона в поле regionHome)
		//Если у пользователя есть регионы для фильтрации по умолчанию - берем оттуда первый. Если нет - Москву
		var mskId = db.regions.findOne({cid: 3}, {_id: 1})._id,
			setId;
		print('Filling regionHome for ' + db.users.count() + ' users');
		db.users.find({}, {_id: 0, cid: 1, regions: 1}).forEach(function (user) {
			if (user.regions && user.regions.length) {
				setId = user.regions[0];
			} else {
				setId = mskId;
			}
			db.users.update({cid: user.cid}, {$set: {regionHome: setId}});
		});

		return {message: 'FINISH in total ' + (Date.now() - startTime) / 1000 + 's'};
	});

	/**
	 * Save function to db.system.js
	 * @param func
	 */
	function saveSystemJSFunc(func) {
		if (!func || !func.name) {
			logger.error('saveSystemJSFunc: function name is not defined');
		}
		db.db.collection('system.js').save(
			{
				_id: func.name,
				value: new mongoose.mongo.Code(func.toString())
			},
			function saveCallback(err) {
				if (err) {
					logger.error(err);
				}
			}
		);
	}
};
