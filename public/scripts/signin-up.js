(function () {

	HTMLElement.prototype.setClass = function(name) {
		this.setAttribute('class', name);
		return this;
	}

	HTMLElement.prototype.addClass = function(name) {
		this.classList.add(name);
		return this;
	}

	HTMLElement.prototype.removeClass = function() {
		this.removeAttribute('class');
		return this;
	}

	HTMLElement.prototype.getClass = function() {
		return this.getAttribute('class');
	}

	document.getElementById('submit').addEventListener('click', function (event) {
		console.log( document.querySelector('li.active').getAttribute('name'));
		document.querySelector('li.active').getAttribute('name') === 'signin' ? signIn() : signUp();
	} , false);
	
	document.addEventListener('keydown', function(event) {
		if (event.keyCode !== 13) return;
		console.log( document.querySelector('li.active').getAttribute('name'));
		document.querySelector('li.active').getAttribute('name') === 'signin' ? signIn() : signUp();
	}, false);

	document.querySelector('#sign-up-container ul.nav.nav-tabs').addEventListener('click', showPane, false);

	
	function showPane(event) {
		if (event.target.tagName !== "A") return;

		var tab = document.querySelector('li.active');
		var newTab = event.target.parentElement;

		if(tab === newTab) return;

		document.getElementById('error').addClass('hide');
		// change active tab to the new tab
		tab.removeClass();
		newTab.setClass('active');

		var newTabPane = document.getElementById(newTab.getAttribute('name'));
		var tabPane = document.querySelector('div.active.in');
		// change active tab pane to the new tab pane
		tabPane.setClass( newTabPane.getClass() );
		newTabPane.addClass('active');
		newTabPane.addClass('in');
	}


	function signIn() {
		var user = getUserData();
		var result = checkData(user);
		if(result instanceof Error) {
			showError(result);
			clearPassword();
		} else 
			sendRequest('POST', '/signin', JSON.stringify(user), function(xhr) {
				document.location.href = '/';
			})
	}

	function signUp() {
		var user = getUserData();
		var result = checkData(user);

		if(result instanceof Error) {
			showError(result);
			clearPassword();
		} else 
			sendRequest('POST', '/signup', JSON.stringify(user), function(xhr) {
				document.location.href = '/';
			})
	}

	function checkData(user) {
		console.log(user);
		var errorText;

		if(!user.email) 
			return new Error('Введите адрес электронной почты.');
	
		if(!checkEmail(user.email))
			return new Error('Некорректный адрес электронной почты.')
				
		if(user.password.length < 8)
			return new Error('Минимальная длина пароля - 8 символов.');

		var confirmPass = document.getElementById('confirmPassword');

		if(isSignUp()){
			if(!confirmPass.value)
				return new Error('Не указан пароль подтверждения.');

			if(user.password !== user.confirmPass)
				return new Error('Пароли не совпадают.');
		}
	}

	function isSignUp(){
		return document.getElementById('signup').classList.contains('active');
	}

	function sendRequest(method, url, sentData, responseHandler) {
		var xhr = new XMLHttpRequest();

		xhr.open(method, url, true) ;
		xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

		xhr.onload = function () {
			if (xhr.status != 200) {
				showError(new Error(xhr.response));
				clearPassword();
			} else {
				responseHandler(xhr);
			}
		}

		xhr.send(sentData);
	}


	function clearPassword() {
		document.getElementById('password').value = '';
		var confirmPass = document.getElementById('confirmPassword');
		if(confirmPass.value)
			confirmPass.value = '';
	}

	function getUserData() {
		return {
			email : document.getElementById('login').value,
			password : document.getElementById('password').value,
			confirmPass: document.getElementById('confirmPassword').value
		}
	}

	function showError(err) {
		var error = document.getElementById('error');
		error.textContent = err.message;
		error.setClass('alert alert-danger');
	}

	function checkEmail(email) {
		re = /@/;
		return re.test(email);
	}


}) ();