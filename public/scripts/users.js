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

window.ee = new EventEmitter();




var Notifications = React.createClass({
	close: function(event) {
		window.ee.emit('closeNotification');
	},

	shapeNotification: function(notification) {
		var type, message;
		if(notification instanceof Error) {
			type = 'danger';
			message = notification.message;
		} else {
			type = 'info';
			message = notification
		}
		return (
			<div id={type} className={'alert alert-' + type}>
				<a href="#" className="close" onClick={this.close}>×</a>
				<p>{message}</p>
			</div>)
	},

	render: function() {
		var notification = this.props.notification;
		return notification?
			this.shapeNotification(notification) :
			null
	}
})



var Registration = React.createClass({
	passwordSource: {
		specials : '!@#$%&*_+?',
		lowercase : 'abcdefghijklmnopqrstuvwxyz',
		uppercase : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
		numbers : '0123456789',
	},

	// check data before sending
	checkData: function(user) {
		if(!user.fullname)
			return new Error('Введите ФИО пользователя.')

		if(!user.email) 
			return new Error('Введите адрес электронной почты.');

		if(!user.password)
			return new Error('Введите пароль.')

		if(user.password.length < 8)
			return new Error('Минимальная длина пароля - 8 символов.');
	
		if(!/@/.test(user.email))
			return new Error('Некорректный адрес электронной почты.');

		return null;
	},

	getInitialState: () => ({
		user: {
			email: '',
			fullname: '',
			password: '',
		},
		notification: null
	}),

	onInputChange: function(event) {
		var input = event.target;
		this.state.user[input.id] = input.value
	},

	componentDidMount: function() {
		window.ee.addListener('closeNotification', () => {
			this.setState({ notification: null });
		});
	},

	// generate secure password
	genPass: function() {
		var source = this.passwordSource;
		var all = source.lowercase + source.uppercase + source.numbers;
		var newPass = 
			source.specials.pick(1) + 
			source.lowercase.pick(1) + 
			source.uppercase.pick(1) + 
			all.pick(5, 7);
		var user = this.state.user;
		this.state.user.password = this.refs.password.value = newPass.shuffle();
	},

	clearInputs: function() {
		
	},

	submit: function() {
		var user = this.state.user
		var err = this.checkData(user)
		if(err) {
			this.setState({ notification: err })
		} else {
			sendRequest('POST', '/users/new', JSON.stringify(user))
				.then((registeredUser) => {
					window.ee.emit('addUser', JSON.parse(registeredUser));
					this.setState({ 
						notification: 'Пользователь ' + user.fullname + ' успешно зарегистрирован.\
							Логин: ' + user.email + ' Пароль: ' + user.password,
						user: { email: '', fullname: '', password: '' }
					})
				})
				.catch(err => {
					this.setState({ 
						notification: err,
						user: { email: '', fullname: '', password: '' }
					})
				})
		}
	},

	render: function() {
		return (
			<div id="reg">
			  	{/* */}
				<h3>Регистрация пользователей:</h3>
				<Notifications notification={this.state.notification}/>
				<div className="col-sm-4 registration">
					<input 
						id="fullname" 
						type="text" 
						placeholder="ФИО" 
						className="form-control"
						ref="fullname"
						onChange={this.onInputChange}/>
				</div>
				<div className="col-sm-3 registration">
					<input 
						id="email" 
						type="text" 
						placeholder="Электронная почта" 
						className="form-control"
						ref="email"
						onChange={this.onInputChange}/>
				</div>
				{/* Password field */}
				<div className="col-sm-3 registration">
					<input
						id="password"
						type="text" 
						placeholder="Пароль" 
						className="form-control"
						ref='password'
						onChange={this.onInputChange}
					/>
				</div>
				{/* Generate password */}
				<div className="col-sm-1 registration" onClick={this.genPass}>
					<button 
						id="genPass" 
						data-toggle="tooltip" 
						title="Сгенерировать пароль" 
						className="btn btn-info btn-block">
						<span aria-hidden="true" className="glyphicon glyphicon-lock"></span>
					</button>
				</div>
				{/* Submit button */}
				<div className="col-sm-1 registration" onClick={this.submit}>
					<button 
						id="addUser" 
						data-toggle="tooltip" 
						title="Добавить пользователя" 
						className="btn btn-primary btn-block">
						<span aria-hidden="true" className="glyphicon glyphicon-plus"></span>
					</button>
				</div>
			</div>
		)
	}

})


var Columns = React.createClass({
	ruColumns: {
		fullname: 'ФИО',
		email: 'Электронная почта',
		role: 'Роль',
		status: 'Статус',
		status_changed: 'Статус изменен'
	},

	render: function() {
		var columns = this.props.columns;
		return (
			<tr>
				{columns.map(column => 
					(<th key={column.name} id={column.name}>
						{this.ruColumns[column.name]}
						{column.sortOrder ? 
							(<span className={'pull-right glyphicon glyphicon-menu-' + (column.sortOrder === 'asc' ? 'down' : 'up')}></span>) :
							null
						}
					</th>))}
			</tr>
		)
	}
})


var User = React.createClass({
	ruStatuses: {
		'active': 'Активен',
		'baned': 'Заблокирован',
		'waiting': 'Ожидает подтверждения регистрации'
	},

	roles: {
		'admin': 'Администратор',
		'employee': 'Сотрудник'
	},

	render: function() {
		var user = this.props.user;
		return (
			<tr>
				<td>{ user.fullname }</td>
				<td>{ user.email }</td>
				<td>{ this.roles[user.role]? this.roles[user.role] : user.role }</td>
				<td>{ this.ruStatuses[user.status] }</td>
				<td>{ (new Date(user.status_changed)).toLocaleString("ru") }</td>
			</tr>
		)
	}
});



var Users = React.createClass({
	getInitialState: () => ({
		columns: [
			{ name: 'fullname', sortOrder: '' },
			{ name: 'email', sortOrder: '' },
			{ name: 'role', sortOrder: '' },
			{ name: 'status', sortOrder: '' },
			{ name: 'status_changed', sortOrder: '' }
		],
		users: []
	}),

	componentDidMount: function() {
		sendRequest('GET', '/api/users')
			.then(response => { this.setState({ users: JSON.parse(response) })})
			.catch(err => { console.log('xhr err:', err) })

		window.ee.addListener('addUser', user => {
			this.setState({ user: this.state.users.push(user) });
		});

		window.ee.addListener('sort', (column, order) => {
			
		});
	},

	sort: function(event) {
		if(event.target.tagName !== 'TH')
			return;

		var columns = this.state.columns;
		var key = event.target.id;
		var clicked = event.target.cellIndex;
		var newOrder = columns[clicked].sortOrder === 'asc' ? 'desc' : 'asc';

		columns[clicked] = Object.assign(columns[clicked], { sortOrder: newOrder });
		this.setState({ 
			users: this.state.users.sort(
				(u1, u2) => columns[clicked].sortOrder === 'asc' ? u1[key] > u2[key] : u1[key] < u2[key]
			),
			columns: columns 
		})
		console.log('state.columns:', this.state.columns)
	},

	showUsers: function(users) {
		return (
			<table className="table table-bordered table-hover">
				<thead onClick={this.sort}>
					<Columns columns={this.state.columns}/>
				</thead>
				<tbody>
					{users.map(
						user => (<User key={user.id} user={user} />)
					)}
				</tbody>
			</table>
		)
	},

	render: function() {
		var users = this.state.users;
		// console.log(users, this.state.columns)
		return (
			<div id="users">
				<h3>Зарегистрированные пользователи:</h3>
				{users.length ? 
					this.showUsers(users) : 
					<p>Пользователей не найдено.</p>}
			</div>
		)
	}
})


var App = React.createClass({
	render: function() {
		return (
			<div id="regPage"> 
				<Registration />
				<Users />
			</div>
		)
	}
})



ReactDOM.render(
  <App />,
  document.getElementById('root')
);


// this.refs.password.value.length < 8 ? 
// 	setTimeout(() => {
// 		this.setState({ error: this.refs.password.value.length < 8 ? 
// 			'Минимальная длина пароля - 8 символов.' : 
// 			'' }) 
// 	}, 1500) : 
// 	this.setState({ error: '' })
