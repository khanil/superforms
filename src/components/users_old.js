var CryptoJS = require('../../libs/cryptoJS')
var sendRequest = require('./xhr')
import Notification from './notification'
import Input from './input'
var eventEmitter = new EventEmitter();


class Registration extends React.Component {
	constructor() {	
		super()
		
		this.roles = {
			'Сотрудник': 'employee',
			'Администратор': 'admin'
		}

		this.verify = {
			email: value => value?
				(/@/.test(value)?
					'' : 'Некорректный адрес электронной почты') :
				'Введите адрес электронной почты',
			name: value => value? '' : 'Введите имя',
			surname: value => value? '' : 'Введите фамилию', 
			patronymic: () => ''
		}

		this.state = {
			user: { email: '', name: '', surname: '', patronymic: '', role: 'employee' },
			errors: { email: '', name: '', surname: '', patronymic: '' },
			isFetching: false,
			notification: null
		}

		this.changeStateHandler = this.changeStateHandler.bind(this)
		this.submitHandler = this.submitHandler.bind(this)
		this.closeNotificationHandler = this.closeNotificationHandler.bind(this)
	}

	changeStateHandler(event) {
		console.log('changeState:', this)
		var input = event.target, newState, value;
		if(input.id === 'role') {
			value = this.roles[input.value]
			newState = { 
				user: Object.assign({},
					this.state.user,
					{ [input.id]: value } // new value
				)
			}
		} else {
			value = input.value.trim()
			var err = this.verify[input.id](value)
			newState = { 
				user: Object.assign(
					{},
					this.state.user,
					{ [input.id]: value }
				),
				errors: Object.assign(
					{}, 
					this.state.errors, 
					{ [input.id]: err }
				)
			}
		}
		this.setState(newState)
	}

	UpdatedProp(prop, value) {
		this[prop] = value;
		return this;
	}

	componentDidMount() {
		eventEmitter.addListener('closeNotification', () => {
			this.setState({ notification: null });
		});
	}

	findErrors() {
		var errors = this.state.errors
		for(let key in errors) {
			if(errors[key] || !(key === 'patronymic' || this.state.user[key]))
				return true
		}
		return null
	}

	closeNotificationHandler() {
		this.setState({ notification: null });
	}

	submitHandler() {
		this.setState({ isFetching: true })
		var salt, user = this.state.user
		
		sendRequest('GET', 'api/users/signup')
			.then(response => {
				salt = response;
				var hash = CryptoJS.AES.encrypt(JSON.stringify(user), salt).toString()
				return sendRequest('POST', '/api/users/signup', hash)
			})
			.then(id => {
				Object.assign(user, { id: id, status: 'waiting', status_changed: new Date() })
				eventEmitter.emit('addUser', user);

				var message = `Пользователь ${user.surname} ${user.name} ${user.patronymic || ''}
					успешно зарегистрирован. На ${user.email} отправлено письмо для подтверждения 
					регистрации.`
				
				this.setState({ 
					notification: message,
					isFetching: false,
					user: { email: '', name: '', surname: '', patronymic: '', role: this.state.user.role }
				})
			})
			.catch(err => {
				this.setState({ 
					notification: err,
					isFetching: false
				})
			})
	}

	// Object.assign(user, data)
	// user.status = 'active';
	// message += `\nЛогин: ${user.email} Пароль: ${user.password}`


	render() {
		// console.log('values:', this.state.user)
		// console.log('errors:', this.state.errors)
		return (
			<div id="reg">
				<h3>Регистрация пользователей:</h3>
				<Notification 
					notification = {this.state.notification} 
					closeHandler = {this.closeNotificationHandler}/>
				<div className='row'>
					<Input 
						className={ "col-sm-4 form-group registration" + (this.state.errors.surname? ' has-error' : '') } 
						id="surname"
						placeholder={this.state.errors.surname || "Фамилия"}
						value={this.state.user.surname}
						onChange={this.changeStateHandler}
					/>
					<div className={ "col-sm-4 form-group registration" + (this.state.errors.patronymic? ' has-error' : '') }>
						<input 
							id="patronymic" 
							type="text" 
							placeholder={this.state.errors.patronymic || "Отчество"}
							className="form-control"
							ref="patronymic"
							value={this.state.user.patronymic}
							onChange={this.changeStateHandler}/>
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
							onChange={this.changeStateHandler}/>
						{this.state.user.email && this.state.errors.email? 
							<span className="help-block">{this.state.errors.email}</span> : null}
					</div>
					<div className="col-sm-4 registration">
						<select 
							id="role"
							type="text" 
							className="form-control"
							ref='role'
							onChange={this.changeStateHandler}>
							<option>Сотрудник</option>
							<option>Администратор</option>
						</select>
					</div>
					<div className="col-sm-3 registration" onClick={this.submitHandler}>
						<button  
							id="addUser" 
							data-toggle="tooltip" 
							title="Добавить пользователя" 
							className="btn btn-primary btn-block"
							disabled={this.findErrors() || this.state.isFetching}>
							{this.state.isFetching? (<span className="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span>): null}
							{this.state.isFetching? ' Проверка электронной почты...' : 'Добавить пользователя'}
						</button>
					</div>
				</div>
			</div>
		)
	}

}

/*
					<div className={ "col-sm-4 form-group registration" + (this.state.errors.name? ' has-error' : '') }>
						<input 
							id="name" 
							type="text" 
							placeholder={this.state.errors.name || "Имя"}
							className="form-control"
							ref="name"
							value={this.state.user.name}
							onChange={this.changeStateHandler}/>
					</div>
*/


var Columns = React.createClass({
	render: function() {
		var columns = this.props.columns;
		return (
			<tr>
				{columns.map(column => 
					(<th key={column.name} id={column.name}>
						{this.props.rusNames[column.name]}
						{column.sortOrder ? 
							(<span 
								className={'pull-right glyphicon glyphicon-menu-' + (column.sortOrder === 'asc' ? 'up' : 'down')}
								title={column.sortOrder? 
									("Отсортировано по " + (column.sortOrder === 'asc' ? 'возрастанию' : 'убыванию')) : null}
							></span>) : null
						}
					</th>))}
			</tr>
		)
	}
})


var User = React.createClass({
	render: function() {
		var props = this.props

		var user = props.user;
		return (
			<tr>
				<td>{ props.getSurnameAndInitials(user) }</td>
				<td>{ user.email }</td>
				<td>{ props.rusNames[user.role]? props.rusNames[user.role] : user.role }</td>
				<td>{ props.rusNames[user.status] }</td>
				<td>{ (new Date(user.status_changed)).toLocaleString("ru") }</td>
				
			</tr>
		)
	}
});


/*
<td>
	<button className='btn btn-default' title="Изменить пароль" >
		<span className='glyphicon glyphicon-cog'></span>
	</button>
</td>
*/


var Users = React.createClass(Object.assign({
	rusNames: {
		// statuses
		active: 'Активен',
		baned: 'Заблокирован',
		waiting: 'Ожидает подтверждения регистрации',
		// roles
		admin: 'Администратор',
		employee: 'Сотрудник',
		// columns
		fullname: 'ФИО',
		email: 'Электронная почта',
		role: 'Роль',
		status: 'Статус',
		status_changed: 'Статус изменен',
		operations: ''
	},
	

	sort: function(event) {
		var target = event.target.tagName === 'SPAN'? 
			event.target.parentElement : event.target;

		if(target.tagName !== 'TH' || target.id === 'operations') return;

		var columns = this.state.columns;
		var key = target.id;
		var clicked = target.cellIndex;
		var newOrder = columns[clicked].sortOrder === 'asc' ? 'desc' : 'asc';

		columns[clicked] = Object.assign(columns[clicked], { sortOrder: newOrder });

		this.setState({ 
			users: this.state.users.sort(columns[clicked].sort.bind(this, key, newOrder)),
			columns: columns
		})
	},


	getInitialState: function() {
		return {
			columns: [
				{ name: 'fullname', sortOrder: '', sort: this.sortFullname },
				{ name: 'email', sortOrder: '', sort: this.sortStrings }, 
				{ name: 'role', sortOrder: '', sort: this.sortRusStrings }, 
				{ name: 'status', sortOrder: '', sort: this.sortRusStrings },
				{ name: 'status_changed', sortOrder: '', sort: this.sortNumbers },
			],
			users: [],
			notification: ''
		}
	},


	componentDidMount: function() {
		sendRequest('GET', '/api/users')
			.then(response => { this.setState({ users: JSON.parse(response, (key, value) => {
						if (key === 'status_changed') 
							return value? new Date(value) : null;
						return value;
					})
				})
			})
			.catch(err => { console.log('xhr err:', err) })

		eventEmitter.addListener('addUser', user => {
			console.log(user)
			this.setState({ users: [].concat(this.state.users, user)});
		});
	},


	getSurnameAndInitials: function(user) {
		return `${user.surname} ${user.name[0]}.${user.patronymic? user.patronymic[0] + '.' : ''}`
	},


	showUsers: function(users) {
		return (
			<table className="table table-bordered table-hover">
				<thead onClick={this.sort}>
					<Columns columns={this.state.columns} rusNames={this.rusNames}/>
				</thead>
				<tbody>
					{users.map(
						user => (<User 
							key={user.id} 
							user={user} 
							rusNames={this.rusNames} 
							getSurnameAndInitials={this.getSurnameAndInitials}/>)
					)}
				</tbody>
			</table>
		)
	},

	render: function() {
		var users = this.state.users;
		return (
			<div id="users">
				<h3>Зарегистрированные пользователи:</h3>
				{users.length ? 
					this.showUsers(users) : 
					<p>Пользователей не найдено.</p>}
			</div>
		)
	}
}, require('./compareFunctions'))
)


var App = React.createClass({
	render: function() {
		return (
			<div id="users-page"> 
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