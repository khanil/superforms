'use strict';

(function () {
	var specials = '!@#$%^&*_+?';
	var lowercase = 'abcdefghijklmnopqrstuvwxyz';
	var uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var numbers = '0123456789';
	var all = specials + lowercase + uppercase + numbers;

	var login = document.getElementById('login');
	var password = document.getElementById('password');
	var error = document.getElementById('error');
	var info = document.getElementById('info');


	clearInputs()
	getUsers()

	function getUsers() {
		sendRequest('GET', '/api/users')
			.then(render)
			['catch'](showError)
	}
 

	// add new user
	document.getElementById('addUser').addEventListener('click', addUser, false);
	
	// 'Enter' key pressure
	document.addEventListener('keydown', (event) => {
		if (event.keyCode !== 13) return;
		addUser();
	}, false);

	// generate secure password
	document.getElementById('genPass').addEventListener('click', genPassword, false);

	// close notification (error or info)
	document.querySelector('#reg').addEventListener('click', (event) => {
		if(event.target !== error.firstElementChild && event.target !== info.firstElementChild) return;
		closeNotice(event)
	}, false);


	function render(users) {

	}


	function addUser() {
		var user = getUserData();
		var result = checkData(user);
		if(result instanceof Error) {
			showError(result);
			clearInputs();
		} else {
			sendRequest('POST', '/users/new', JSON.stringify(user))
				.then( () => {
					var message = 'Пользователь успешно зарегистрирован. <strong>Логин:</strong> ' + 
					user.email + '\t<strong>Пароль:</strong> ' + user.password;
					showInfo(message)	
				})
				['catch'](showError)
		}
	}


	function genPassword() {
		var newPass = specials.pick(1) + lowercase.pick(1) + uppercase.pick(1) + all.pick(5, 7);
		password.value = newPass.shuffle();
	}


	function closeNotice(event) {
		var notification = event.target.parentElement;
		var currentClass = notification.getAttribute('class');
		notification.setAttribute('class', currentClass + ' hide');
	}


	function getUserData() {
		return {
			email : login.value,
			password : password.value,
		}
	}


	// xhr
	function sendRequest(method, url, sentData) {

		return new Promise(function(resolve, reject) {
			var xhr = new XMLHttpRequest();
			xhr.open(method, url, true);
			xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

			xhr.onload = function() {
				if (this.status === 200) {
					resolve(this.response);
				} else {
					reject(new Error(this.response));
				}
			};
			xhr.onerror = function() {
				reject(new Error("Ошибка сети"));
			};
			sentData ? xhr.send(sentData) : xhr.send();
		});

	}


	function checkData(user) {
		var errorText;

		if(!user.email) 
			return new Error('Введите адрес электронной почты.');

		if(user.password.length < 8)
			return new Error('Минимальная длина пароля - 8 символов.');
	
		if(!checkEmail(user.email))
			return new Error('Некорректный адрес электронной почты.')
	}


	function clearInputs() {
		login.value = '';
		password.value = '';
	}


	function showInfo(message) {
		var info = document.querySelector('#info p');
		info.innerHTML = message
		info.parentElement.setAttribute('class', 'alert alert-info');
	}

	function showError(err) {
		var error = document.querySelector('#error p');
		error.textContent = err.message;
		error.parentElement.setAttribute('class', 'alert alert-danger');
	}	


	function checkEmail(email) {
		var re = /@/;
		return re.test(email);
	}


	String.prototype.pick = function(min, max) {
		var n, chars = '';
		n = (typeof max === 'undefined') ? min : min + Math.round(Math.random() * (max - min + 1));
		for (var i = 0; i < n; i++) {
			chars += this.charAt(Math.round(Math.random() * this.length));
		}
		return chars;
	};


	String.prototype.shuffle = function() {
		var array = this.split('');
		var tmp, current, top = array.length;

		if (top) while (--top) {
			current = Math.floor(Math.random() * (top + 1));
			tmp = array[current];
			array[current] = array[top];
			array[top] = tmp;
		}

		return array.join('');
	};


}) ();


	// document.querySelector('#sign-up-container ul.nav.nav-tabs').addEventListener('click', showPane, false);

	// function showPane(event) {
	// 	if (event.target.tagName !== "A") return;

	// 	var tab = document.querySelector('li.active');
	// 	var newTab = event.target.parentElement;

	// 	if(tab === newTab) return;

	// 	document.getElementById('error').addClass('hide');
	// 	// change active tab to the new tab
	// 	tab.removeClass();
	// 	newTab.setClass('active');

	// 	var newTabPane = document.getElementById(newTab.getAttribute('name'));
	// 	var tabPane = document.querySelector('div.active.in');
	// 	// change active tab pane to the new tab pane
	// 	tabPane.setClass( newTabPane.getClass() );
	// 	newTabPane.addClass('active');
	// 	newTabPane.addClass('in');
	// }