var CryptoJS = require('../../libs/cryptoJS')
var sendRequest = require('./xhr')
import Notification from './notification'
import Input from './input'
import Select from './select'
import translate from './dictionary'
var eventEmitter = new EventEmitter();
import ModalWindow from './modalWindow'

class Registration extends React.Component {
	
	constructor() {	
		super()

		this.verify = {
			email: value => value?
				(/@/.test(value)?
					'' : 'Некорректный адрес электронной почты') :
				'Введите адрес электронной почты',
			name: value => value? '' : 'Введите имя',
			surname: value => value? '' : 'Введите фамилию', 
			patronymic: () => ''
		}

		this.getValue = {
			email: () => this.state.user.email.value, 
			name: () => this.state.user.name.value,
			surname: () => this.state.user.surname.value, 
			patronymic: () => this.state.user.patronymic.value,
			role: user => this.state.user.role
		}

		this.roles = ['admin', 'employee'];

		this.state = {
			user: { 
				email: {value: '', requiredToFill: true, err: ''},
				name: {value: '', requiredToFill: true, err: ''},
				surname: {value: '', requiredToFill: true, err: ''},
				patronymic: {value: '', requiredToFill: false, err: ''},
				role: 'employee' 
			},
			isFetching: false,
			notification: null
		}

		this.changeInputStateHandler = this.changeInputStateHandler.bind(this)
		this.changeSelectStateHandler = this.changeSelectStateHandler.bind(this)
		this.submitHandler = this.submitHandler.bind(this)
		this.closeNotificationHandler = this.closeNotificationHandler.bind(this)
	}


	changeInputStateHandler(event) {
		var input = event.target;
		const newState = {
			value: input.value.trim(),
			err: this.verify[input.id](input.value)
		};

		this.setState({ 
			user: Object.assign({}, this.state.user, {[input.id]: newState})
		})
	}


	changeSelectStateHandler(event) {
		var input = event.target;
		const newValue = translate.intoEng(input.value);

		this.setState({ 
			user: Object.assign({}, this.state.user, { [input.id]: newValue })
		})
	}


	findInputErrors() {
		const user = this.state.user
		for(let key in user) {
			if(user[key].requiredToFill && user[key] || user[key].err)
				return true
		}
		return false
	}


	closeNotificationHandler() {
		this.setState({ notification: null });
	}


	handleResponseData(data, user) {
		Object.assign(user, data, { status_changed: new Date() })
		
		const message = `Пользователь <b>${user.surname} ${user.name} 
			${user.patronymic || ''}</b> успешно зарегистрирован.
			<br><b>email</b>: ${user.email}<br><b>пароль</b>: ${user.password}`
		
		delete user.password
		eventEmitter.emit('addUser', user);

		this.setState({ 
			notification: message,
			isFetching: false,
			user: { email: '', name: '', surname: '', patronymic: '', role: this.state.user.role }
		})
	}


	submitHandler() {
		this.setState({ isFetching: true })
		var salt, user = this.state.user
		for(let key in this.state.user) {
			user[key] = this.getValue[key]();
		}

		sendRequest('GET', 'api/users/signup')
			.then(response => {
				salt = response;
				var hash = CryptoJS.AES.encrypt(JSON.stringify(user), salt).toString()
				return sendRequest('POST', '/api/users/signup', hash)
			})
			.then(data => CryptoJS.AES.decrypt(data, salt).toString(CryptoJS.enc.Utf8))
			.then(JSON.parse)
			.then(data => { this.handleResponseData(data, user) })
			.catch(err => {
				this.setState({ 
					notification: err,
					isFetching: false
				})
			})
	}


	render() {
		const {user, notification} = this.state;
		return (
			<div id="reg">
				<h3>Регистрация пользователей:</h3>
				<Notification 
					notification = {notification} 
					closeHandler = {this.closeNotificationHandler}/>
				<div className='row'>
					<Input 
						className={ "col-sm-4 form-group registration" + 
							(user.surname.err? ' has-error' : '') } 
						id="surname"
						placeholder={user.surname.err || "Фамилия"}
						value={user.surname.value}
						changeStateHandler={this.changeInputStateHandler}
					/>
					<Input 
						className={ "col-sm-4 form-group registration" + 
							(user.name.err? ' has-error' : '') } 
						id="name"
						placeholder={user.name.err || "Имя"}
						value={user.name.value}
						changeStateHandler={this.changeInputStateHandler}
					/>
					<Input 
						className={ "col-sm-4 form-group registration" } 
						id="patronymic"
						placeholder={user.patronymic.err || "Отчество"}
						value={user.patronymic.value}
						changeStateHandler={this.changeInputStateHandler}
					/>
				</div>
				<div className='row'>
					<Input 
						className={ "col-sm-5 form-group registration" + 
							(user.email.err? ' has-error' : '') } 
						id="email"
						placeholder={user.email.err || "Адрес электронной почты"}
						value={user.email.value}
						changeStateHandler={this.changeInputStateHandler}
						helpBlock={user.email.value && user.email.err? 
							user.email.err : null}
					/>
					<Select
						className={"col-sm-4 form-group registration"}
						id="role"
						options={this.roles}
						selected={user.role}
						changeStateHandler={this.changeSelectStateHandler}
					/>
					<div className="col-sm-3 registration" onClick={this.submitHandler}>
						<button  
							id="addUser" 
							data-toggle="tooltip" 
							title="Добавить пользователя" 
							className="btn btn-primary btn-block"
							disabled={this.findInputErrors() || this.state.isFetching}>
							{this.state.isFetching? (<span className="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span>): null}
							{this.state.isFetching? ' Проверка электронной почты...' : 'Добавить пользователя'}
						</button>
					</div>
				</div>
			</div>
		)
	}

}



var Columns = React.createClass({
	render: function() {
		var columns = this.props.columns;
		return (
			<tr>
				{columns.map(column => 
					(<th key={column.name} id={column.name}>
						{translate.intoRus(column.name)}
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
				<td>{ translate.intoRus(user.role) || user.role }</td>
				<td>{ translate.intoRus(user.status) }</td>
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
					<Columns columns={this.state.columns}/>
				</thead>
				<tbody>
					{users.map(
						user => (<User 
							key={user.id} 
							user={user} 
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