/*global define:true*/

/**
 * Модель главной в админке
 */
define([
	'underscore', 'jquery', 'Browser', 'Utils', 'socket!', 'Params', 'knockout', 'knockout.mapping', 'm/_moduleCliche', 'globalVM', 'renderer',
	'text!tpl/admin/main.jade', 'css!style/admin/main'
], function (_, $, Browser, Utils, socket, P, ko, ko_mapping, Cliche, globalVM, renderer, jade) {
	'use strict';

	return Cliche.extend({
		jade: jade,
		options: {
			deferredWhenReady: null // Deffered wich will be resolved when map ready
		},
		create: function () {
			this.destroy = _.wrap(this.destroy, this.localDestroy);
			this.auth = globalVM.repository['m/common/auth'];
			this.onlines = ko_mapping.fromJS({all: 0, users: 0, sessUC: 0, sessAC: 0, sockUC: 0, sockAC: 0});

			this.giveOnlives(function () {
				ko.applyBindings(globalVM, this.$dom[0]);
				this.show();
			}, this);
		},
		show: function () {
			globalVM.func.showContainer(this.$container);
			this.showing = true;
		},
		hide: function () {
			globalVM.func.hideContainer(this.$container);
			this.showing = false;
		},
		localDestroy: function (destroy) {
			window.clearTimeout(this.timeoutUpdate);
			this.hide();
			destroy.call(this);
		},

		giveOnlives: function (cb, ctx) {
			if (this.pending) {
				return;
			}
			this.pending = true;
			socket.once('takeOnlineStat', function (data) {
				this.pending = false;

				if (!data || data.error) {
					window.noty({text: data && data.message || 'Error occurred', type: 'error', layout: 'center', timeout: 3000, force: true});
				} else {
					ko_mapping.fromJS(data, this.onlines);
				}

				if (Utils.isType('function', cb)) {
					cb.call(ctx);
				}
				this.timeoutUpdate = window.setTimeout(this.giveOnlives.bind(this), 5000);
			}.bind(this));
			socket.emit('getOnlineStat');
		}
	});
});