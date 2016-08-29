'use strict';

(() => {
	// signin
	document.getElementById('submit').addEventListener('click', signIn, false);
	
	// 'Enter' key pressure
	document.addEventListener('keydown', (event) => {
		if (event.keyCode !== 13) return;
		signIn()
	}, false);

	// hide error
	document.querySelector('#error a').addEventListener('click', (event) => {
		var error = event.target.parentElement,
			currentClass = error.getAttribute('class')
		error.setAttribute('class', currentClass + ' hide')
	}, false)


	function signIn() {
		var user = getUserData();
		var result = checkData(user);
		if(result instanceof Error) {
			showError(result);
			clearPassword();
		} else {
			sendRequest('POST', '/signin', JSON.stringify(user))
				.then( () => {
					var url = document.location.href;
					document.location.href = (url === '/') ? '/forms' : url;
				})
				['catch'](err => {
					clearPassword()
					showError(err);
				})
		}
	}


	function checkData(user) {
		if(!user.email) 
			return new Error('Введите адрес электронной почты.');
	
		if(user.password.length < 8)
			return new Error('Минимальная длина пароля - 8 символов.');

		if(!checkEmail(user.email))
			return new Error('Некорректный адрес электронной почты.')
	}


	
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


	function clearPassword() {
		document.getElementById('password').value = '';
	}

	function getUserData() {
		return {
			email : document.getElementById('login').value,
			password : document.getElementById('password').value,
		}
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


})()