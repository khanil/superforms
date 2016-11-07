'use strict';



(() => {

	let CryptoJS = require('../../libs/cryptoJS')
	let sendRequest = require('./xhr');

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


	function encrypt(data, salts) {
		const [salt, tempSalt] = salts.split('$');
		data = CryptoJS.SHA3(data, salt).toString()
		return CryptoJS.HmacSHA3(data, tempSalt).toString()
	}


	function signIn() {
		let user = getUserData();
		const result = checkData(user);
		if(result instanceof Error) {
			showError(result);
			clearPassword();
		} else {
			sendRequest('PUT', '/api/signin', user.email)
				.then(response => {
					const hash = encrypt(user.password, response)
					return sendRequest('POST', '/api/signin', hash)
				})
				.then( () => {
					document.location.reload();
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