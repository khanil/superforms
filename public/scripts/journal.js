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

	var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

	var sendRequest = __webpack_require__(1);

	window.ee = new EventEmitter();

	var Columns = React.createClass({
		displayName: 'Columns',

		render: function render() {
			var _this = this;

			console.log(this.props);
			var columns = this.props.columns;
			return React.createElement(
				'tr',
				null,
				columns.map(function (column) {
					return React.createElement(
						'th',
						{
							key: column.name,
							id: column.name },
						_this.props.rusNames[column.name],
						column.sortOrder ? React.createElement('span', {
							className: 'pull-right glyphicon glyphicon-menu-' + (column.sortOrder === 'asc' ? 'up' : 'down'),
							title: column.sortOrder ? "Отсортировано по " + (column.sortOrder === 'asc' ? 'возрастанию' : 'убыванию') : null
						}) : null
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
					this.props.rusNames[form.type]
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

		rusNames: {
			// columns
			index: '№',
			author: 'Автор',
			type: 'Назначение',
			title: 'Название',
			created: 'Создана',
			sent: 'Отправлена',
			expires: 'Истекает',
			resp_count: 'Ответы',
			// form types
			monitoring: 'мониторинг',
			interview: 'опрос',
			voting: 'голосование',
			survey: 'анкетирование'
		},

		compareStrings: function compareStrings() {
			for (var _len = arguments.length, rest = Array(_len), _key = 0; _key < _len; _key++) {
				rest[_key] = arguments[_key];
			}

			var _rest$map = rest.map(function (str) {
				return str.toLowerCase();
			});

			var _rest$map2 = _slicedToArray(_rest$map, 2);

			var s1 = _rest$map2[0];
			var s2 = _rest$map2[1];

			return +(s1 < s2) || +(s1 === s2) - 1;
		},

		sortFullname: function sortFullname(key, order) {
			for (var _len2 = arguments.length, rest = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
				rest[_key2 - 2] = arguments[_key2];
			}

			var _rest$map3 = rest.map(function (user) {
				return user.surname + ' ' + user.name[0] + '.' + (user.patronymic ? user.patronymic[0] + '.' : '');
			});

			var _rest$map4 = _slicedToArray(_rest$map3, 2);

			var fname1 = _rest$map4[0];
			var fname2 = _rest$map4[1];

			var result = this.compareStrings(fname1, fname2);
			return order === 'asc' ? -result : result;
		},

		sortRusStrings: function sortRusStrings(key, order) {
			var _this2 = this;

			for (var _len3 = arguments.length, rest = Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
				rest[_key3 - 2] = arguments[_key3];
			}

			var _rest$map5 = rest.map(function (user) {
				return _this2.rusNames[user[key]] || user[key];
			});

			var _rest$map6 = _slicedToArray(_rest$map5, 2);

			var rus1 = _rest$map6[0];
			var rus2 = _rest$map6[1];

			var result = this.compareStrings(rus1, rus2);
			return order === 'asc' ? -result : result;
		},

		sortStrings: function sortStrings(key, order, obj1, obj2) {
			var result = this.compareStrings(obj1[key], obj2[key]);
			return order === 'asc' ? -result : result;
		},

		sortNumbers: function sortNumbers(key, order, f1, f2) {
			return order === 'asc' ? f1[key] - f2[key] : f2[key] - f1[key];
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

		getInitialState: function getInitialState() {
			return {
				columns: [{ name: 'index', sortOrder: '', sort: this.sortNumbers }, { name: 'author', sortOrder: '', sort: this.sortStrings }, { name: 'type', sortOrder: '', sort: this.sortRusStrings }, { name: 'title', sortOrder: '', sort: this.sortStrings }, { name: 'created', sortOrder: '', sort: this.sortNumbers }, { name: 'sent', sortOrder: '', sort: this.sortNumbers }, { name: 'expires', sortOrder: '', sort: this.sortNumbers }, { name: 'resp_count', sortOrder: '', sort: this.sortNumbers }],
				forms: []
			};
		},

		componentDidMount: function componentDidMount() {
			var _this3 = this;

			sendRequest('GET', '/api/journal').then(function (response) {
				_this3.setState({
					forms: JSON.parse(response, function (key, value) {
						if (key === 'created' || key === 'sent' || key === 'expires') return value ? new Date(value) : null;
						return value;
					})
				});
			}).catch(function (err) {
				console.log('xhr err:', err);
			});
		},

		showList: function showList(forms) {
			var _this4 = this;

			return React.createElement(
				'table',
				{ className: 'table table-bordered table-hover' },
				React.createElement(
					'thead',
					{ onClick: this.sort },
					React.createElement(Columns, { columns: this.state.columns, rusNames: this.rusNames })
				),
				React.createElement(
					'tbody',
					null,
					forms.map(function (form, i) {
						return React.createElement(Form, { key: form.id, form: form, rusNames: _this4.rusNames });
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
					'\u0424\u043E\u0440\u043C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E.'
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