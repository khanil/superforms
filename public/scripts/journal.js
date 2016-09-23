/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var sendRequest = __webpack_require__(1);

	window.ee = new EventEmitter();

	var Columns = React.createClass({
		displayName: 'Columns',

		ruColumns: {
			index: '№',
			author: 'Автор',
			type: 'Назначение',
			title: 'Название',
			created: 'Создана',
			sent: 'Отправлена',
			expires: 'Истекает',
			resp_count: 'Ответы'
		},

		render: function render() {
			var _this = this;

			var columns = this.props.columns;
			return React.createElement(
				'tr',
				null,
				columns.map(function (column) {
					return React.createElement(
						'th',
						{
							key: column.name,
							id: column.name,
							title: column.sortOrder ? "Отсортировано по " + (column.sortOrder === 'asc' ? 'возрастанию' : 'убыванию') : null },
						_this.ruColumns[column.name],
						column.sortOrder ? React.createElement('span', { className: 'pull-right glyphicon glyphicon-menu-' + (column.sortOrder === 'asc' ? 'up' : 'down') }) : null
					);
				})
			);
		}
	});

	var Form = React.createClass({
		displayName: 'Form',

		redirect: function redirect(event) {
			var target = event.target;
			while (target.tagName !== 'TR') {
				if (target.tagname === 'TBODY') return;
				target = target.parentElement;
			}
			document.location.href = '/forms/' + this.props.form.id + '/responses';
		},

		render: function render() {
			var form = this.props.form;
			var rus = this.props.rus;
			return React.createElement(
				'tr',
				{ onClick: this.redirect },
				React.createElement(
					'td',
					null,
					form.index
				),
				React.createElement(
					'td',
					null,
					form.author
				),
				React.createElement(
					'td',
					null,
					rus[form.type]
				),
				React.createElement(
					'td',
					null,
					form.title
				),
				React.createElement(
					'td',
					null,
					form.created.toLocaleString("ru")
				),
				React.createElement(
					'td',
					null,
					form.sent ? form.sent.toLocaleString("ru") : 'не отправлена'
				),
				React.createElement(
					'td',
					null,
					form.expires ? form.expires.toLocaleString("ru") : 'нет'
				),
				React.createElement(
					'td',
					null,
					form.resp_count ? form.resp_count : 0
				)
			);
		}
	});

	var Forms = React.createClass({
		displayName: 'Forms',

		rus: {
			monitoring: 'мониторинг',
			interview: 'опрос',
			voting: 'голосование',
			survey: 'анкетирование'
		},

		sortNumbers: function sortNumbers(key, order, f1, f2) {
			return order === 'asc' ? f1[key] - f2[key] : f2[key] - f1[key];
		},

		sortRusTypes: function sortRusTypes(key, order, f1, f2) {
			var type1 = this.rus[f1[key]] || f1[key];
			var type2 = this.rus[f2[key]] || f2[key];
			return order === 'asc' ? +(type1 > type2) || +(type1 === type2) - 1 : +(type1 < type2) || +(type1 === type2) - 1;
		},

		defaultSort: function defaultSort(key, order, f1, f2) {
			return order === 'asc' ? +(f1[key] > f2[key]) || +(f1[key] === f2[key]) - 1 : +(f1[key] < f2[key]) || +(f1[key] === f2[key]) - 1;
		},

		getInitialState: function getInitialState() {
			return {
				columns: [{ name: 'index', sortOrder: '', sort: this.sortNumbers }, { name: 'author', sortOrder: '', sort: this.defaultSort }, { name: 'type', sortOrder: '', sort: this.sortRusTypes }, { name: 'title', sortOrder: '', sort: this.defaultSort }, { name: 'created', sortOrder: '', sort: this.sortNumbers }, { name: 'sent', sortOrder: '', sort: this.sortNumbers }, { name: 'expires', sortOrder: '', sort: this.sortNumbers }, { name: 'resp_count', sortOrder: '', sort: this.sortNumbers }],
				forms: []
			};
		},

		componentDidMount: function componentDidMount() {
			var _this2 = this;

			sendRequest('GET', '/api/journal').then(function (response) {
				_this2.setState({
					forms: JSON.parse(response, function (key, value) {
						if (key === 'created' || key === 'sent' || key === 'expires') return value ? new Date(value) : null;
						return value;
					})
				});
			}).catch(function (err) {
				console.log('xhr err:', err);
			});
		},

		sort: function sort(event) {
			var target = event.target.tagName === 'SPAN' ? event.target.parentElement : event.target;

			if (target.tagName !== 'TH') return;

			var columns = this.state.columns;
			var key = target.id;
			var clicked = target.cellIndex;
			var newOrder = columns[clicked].sortOrder === 'asc' ? 'desc' : 'asc';
			columns[clicked] = Object.assign(columns[clicked], { sortOrder: newOrder });

			this.setState({
				forms: this.state.forms.sort(columns[clicked].sort.bind(this, key, newOrder)),
				columns: columns
			});
		},

		showList: function showList(forms) {
			var _this3 = this;

			return React.createElement(
				'table',
				{ className: 'table table-bordered table-hover' },
				React.createElement(
					'thead',
					{ onClick: this.sort },
					React.createElement(Columns, { columns: this.state.columns })
				),
				React.createElement(
					'tbody',
					null,
					forms.map(function (form, i) {
						return React.createElement(Form, { key: form.id, form: form, rus: _this3.rus });
					})
				)
			);
		},

		render: function render() {
			var forms = this.state.forms;
			return React.createElement(
				'div',
				{ id: 'journal', className: 'table-responsive' },
				forms.length ? this.showList(forms) : React.createElement(
					'p',
					null,
					'Форм не найдено.'
				)
			);
		}
	});

	var App = React.createClass({
		displayName: 'App',

		render: function render() {
			return React.createElement(Forms, null);
		}
	});

		ReactDOM.render(React.createElement(App, null), document.getElementById('root'));

/***/ },
/* 1 */
/***/ function(module, exports) {

	"use strict";

	module.exports = function (method, url, sentData) {

		return new Promise(function (resolve, reject) {

			var xhr = new XMLHttpRequest();
			xhr.open(method, url, true);
			xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

			xhr.onload = function () {
				if (this.status === 200) {
					resolve(this.response);
				} else {
					reject(new Error(this.response));
				}
			};

			xhr.onerror = function () {
				reject(new Error("Ошибка сети"));
			};

			sentData ? xhr.send(sentData) : xhr.send();
		});
		};

/***/ }
/******/ ]);
//# sourceMappingURL=journal.js.map