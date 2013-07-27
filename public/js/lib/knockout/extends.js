/*global requirejs:true, require:true, define:true*/
/**
 * Klimashkin
 */
define(['jquery', 'underscore', 'knockout'], function ($, _, ko) {

	/**
	 * Создает новый дочерний контекст у дочерних элементов
	 * @type {Object}
	 */
	ko.bindingHandlers.newChildContext = {
		init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			var flag = valueAccessor(),
				childBindingContext = bindingContext.createChildContext(viewModel);
			ko.applyBindingsToDescendants(childBindingContext, element);

			// Also tell KO *not* to bind the descendants itself, otherwise they will be bound twice
			return { controlsDescendantBindings: true };
		}
	};
	ko.virtualElements.allowedBindings.newChildContext = true;

	/**
	 * Позволяет отменить байндинг у элемента и его потомков
	 * @type {Object}
	 */
	ko.bindingHandlers.allowBindings = {
		init: function (elem, valueAccessor) {
			// Let bindings proceed as normal *only if* my value is false
			var shouldAllowBindings = ko.unwrap(valueAccessor());
			return { controlsDescendantBindings: !shouldAllowBindings };
		}
	};
	ko.virtualElements.allowedBindings.allowBindings = true;

	/**
	 * Объединяет два массива
	 * @param arr Массив для объединения
	 * @param before Флаг, означающий что надо вставить в начало
	 * @return {*}
	 */
	ko.observableArray.fn.concat = function (arr, before) {
		var underlyingArray = this(),
			methodCallResult;

		this.valueWillMutate();
		methodCallResult = Array.prototype[(before ? 'unshift' : 'push')][(Array.isArray(arr) ? 'apply' : 'call')](underlyingArray, arr);
		this.valueHasMutated();

		return methodCallResult;
	};

	/**
	 * Вызывает переданную функцию по нажатию enter
	 * @type {Object}
	 */
	ko.bindingHandlers.executeOnEnter = {
		init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
			var allBindings = allBindingsAccessor();
			$(element).keypress(function (event) {
				var keyCode = event.which || event.keyCode;
				if (keyCode === 13) {
					allBindings.executeOnEnter.call(viewModel);
					return false;
				}
				return true;
			});
		}
	};

	/**
	 * Редактирование содержимого элементов с помошью contenteditable
	 * Inspired by https://groups.google.com/forum/#!topic/knockoutjs/Mh0w_cEMqOk
	 * @type {Object}
	 */
	ko.bindingHandlers.cEdit = {
		init: function (element, valueAccessor, allBindingsAccessor) {
		},
		update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
			var obj = ko.unwrap(valueAccessor()),
				$element = $(element);

			$element.text(ko.isWriteableObservable(obj.val) ? obj.val() : obj.val);

			if (obj.edit) {
				if (!$element.attr('contenteditable')) {
					$element
						.css({display: ''})
						.attr('contenteditable', "true")
						.on('blur', function () {
							var modelValue = obj.val,
								elementValue = $.trim($element.text());

							$element.text(elementValue);
							if (ko.isWriteableObservable(modelValue)) {
								if (elementValue === modelValue()) {
									checkForCap();
								} else {
									modelValue(elementValue);
								}
							}
						})
						.on('focus', function () {
							$element.removeClass('cap');
							if (_.isEmpty(String(ko.isWriteableObservable(obj.val) ? obj.val() : obj.val))) {
								$element.html('&nbsp;');
							}
						});
					checkForCap();
				} else {
					checkForCap();
				}
			} else {
				if ($element.attr('contenteditable') === 'true') {
					$element.off('blur').off('focus').removeAttr('contenteditable').removeClass('cap');
				}
				if (_.isEmpty(String(ko.isWriteableObservable(obj.val) ? obj.val() : obj.val))) {
					$element.css({display: 'none'});
				}
			}

			function checkForCap() {
				if (obj.edit && obj.cap && _.isEmpty(String(ko.isWriteableObservable(obj.val) ? obj.val() : obj.val))) {
					$element.addClass('cap');
					$element.text(obj.cap);
				} else {
					$element.removeClass('cap');
				}
			}
		}
	};
});