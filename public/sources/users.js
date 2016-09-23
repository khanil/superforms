var CryptoJS = require('../../libs/cryptoJS')
var sendRequest = require('./xhr')


var ee = new EventEmitter();

var Notification = React.createClass({
	close: function(event) {
		ee.emit('closeNotification');
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
			<div id={type} className={`alert alert-${type}`}>
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

	roles: {
		'Сотрудник': 'employee',
		'Администратор': 'admin'
	},

	verify: {
		email: value => value?
			(/@/.test(value)? '' : 'Некорректный адрес электронной почты') :
			'Введите адрес электронной почты',
		name: value => value? '' : 'Введите имя',
		surname: value => value? '' : 'Введите фамилию', 
		patronymic: () => ''
	},

	getInitialState: () => ({
		user: { email: '', name: '', surname: '', patronymic: '', role: 'employee' },
		errors: { email: '', name: '', surname: '', patronymic: '' },
		notification: null
	}),

	changeState: function(event) {
		var input = event.target, newState, value;
		if(input.id === 'role') {
			value = this.roles[input.value]
			newState = { 
				user: Object.assign(this.state.user, new this.State(input.id, value))
			}
		} else {
			value = input.value.trim()
			var err = this.verify[input.id](value)
			newState = { 
				user: Object.assign(this.state.user, new this.State(input.id, value)),
				errors: Object.assign(this.state.errors, new this.State(input.id, err))
			}
		}
		this.setState(newState)
	},

	State: function(key, value) {
		this[key] = value;
		return this;
	},

	componentDidMount: function() {
		ee.addListener('closeNotification', () => {
			this.setState({ notification: null });
		});
	},

	findErrors: function() {
		var errors = this.state.errors
		for(let key in errors) {
			if(errors[key] || !(key === 'patronymic' || this.state.user[key]))
				return true
		}
		return null
	},

	submit: function() {
		var user = this.state.user
			sendRequest('GET', 'api/users/signup')
				.then(response => {
					var hash = CryptoJS.AES.encrypt(JSON.stringify(user), response).toString()
					return sendRequest('POST', '/api/users/signup', hash)
				})
				.then(user_id => {
					user.id = user_id;
					user.status = 'waiting';
					user.status_changed = new Date();
					ee.emit('addUser', user);
					this.setState({ 
						notification: 
							`Пользователь ${user.surname} ${user.name} ${user.patronymic} успешно зарегистрирован.
							На ${user.email} отправлено письмо для завершения регистрации.`,
						user: { email: '', name: '', surname: '', patronymic: '' }
					})
				})
				.catch(err => {
					this.setState({ 
						notification: err
					})
				})
	},

	render: function() {
		// console.log('values:', this.state.user)
		// console.log('errors:', this.state.errors)
		return (
			<div id="reg">
				<h3>Регистрация пользователей:</h3>
				<Notification notification={this.state.notification}/>
				<div className='row control-group'>
					<div className={ "col-sm-4 form-group registration" + (this.state.errors.surname? ' has-error' : '') }>
						<input 
							id="surname"
							type="text" 
							placeholder={this.state.errors.surname || "Фамилия"} 
							className="form-control"
							ref="surname"
							value={this.state.user.surname}
							onChange={this.changeState}/>
					</div>
					<div className={ "col-sm-4 form-group registration" + (this.state.errors.name? ' has-error' : '') }>
						<input 
							id="name" 
							type="text" 
							placeholder={this.state.errors.name || "Имя"}
							className="form-control"
							ref="name"
							value={this.state.user.name}
							onChange={this.changeState}/>
					</div>
					<div className={ "col-sm-4 form-group registration" + (this.state.errors.patronymic? ' has-error' : '') }>
						<input 
							id="patronymic" 
							type="text" 
							placeholder={this.state.errors.patronymic || "Отчество"}
							className="form-control"
							ref="patronymic"
							value={this.state.user.patronymic}
							onChange={this.changeState}/>
					</div>
				</div>
				<div className='row'>
					<div className={ "col-sm-5 registration" + (this.state.errors.email? ' has-error' : '') }>
						<input 
							id="email"
							type="text" 
							placeholder={this.state.errors.email || "Адрес электронной почты"}
							className="form-control"
							ref="email"
							value={this.state.user.email}
							onChange={this.changeState}/>
						{this.state.user.email && this.state.errors.email? 
							<span className="help-block">{this.state.errors.email}</span> : null}
					</div>
					<div className="col-sm-4 registration">
						<select 
							id="role"
							type="text" 
							className="form-control"
							ref='role'
							onChange={this.changeState}>
							<option>Сотрудник</option>
							<option>Администратор</option>
						</select>
					</div>
					<div className="col-sm-3 registration" onClick={this.submit}>
						<button 
							id="addUser" 
							data-toggle="tooltip" 
							title="Добавить пользователя" 
							className="btn btn-primary btn-block"
							disabled={this.findErrors()}>
							Добавить пользователя
						</button>
					</div>
				</div>
			</div>
		)
	}

})
// <span aria-hidden="true" className="glyphicon glyphicon-plus"></span>

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

		ee.addListener('addUser', user => {
			this.setState({ user: this.state.users.push(user) });
		});

		ee.addListener('sort', (column, order) => {
			
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
