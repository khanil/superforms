var sendRequest = require('./xhr')

window.ee = new EventEmitter();


var Columns = React.createClass({
	render: function() {
		console.log(this.props)
		var columns = this.props.columns;
		return (
			<tr>
				{columns.map(column => 
					(<th 
						key={column.name} 
						id={column.name}> 
						{this.props.rusNames[column.name]}
						{column.sortOrder ? 
							(<span 
								className={'pull-right glyphicon glyphicon-menu-' + (column.sortOrder === 'asc' ? 'up' : 'down')}
								title={column.sortOrder? ("Отсортировано по " + (column.sortOrder === 'asc' ? 'возрастанию' : 'убыванию')) : null}
							></span>) :
							null
						}
					</th>))}
			</tr>
		)
	}
})


var Form = React.createClass({
	redirect: function(event) {
		var target = event.target
		while(target.tagName !== 'TR') {
			if(target.tagname === 'TBODY')
				return;
			target = target.parentElement;
		}
		document.location.href = '/forms/' + this.props.form.id + '/responses'
	},

	render: function() {
		var form = this.props.form
		return (
			<tr onClick={this.redirect}>
				<td>{ form.index }</td>
				<td>{ form.author }</td>
				<td>{ this.props.rusNames[form.type] }</td>
				<td>{ form.title }</td>
				<td>{ form.created.toLocaleString("ru") }</td>
				<td>{ form.sent? form.sent.toLocaleString("ru") : 'не отправлена' }</td>
				<td>{ form.expires? form.expires.toLocaleString("ru") : 'нет' }</td>
				<td>{ form.resp_count? form.resp_count : 0 }</td>
			</tr>
		)
	}
});



var Forms = React.createClass({
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

	compareStrings: function(...rest) {
		let [s1, s2] = rest.map(str => str.toLowerCase())
		return +(s1 < s2) || +(s1 === s2) - 1
	},

	sortFullname: function(key, order, ...rest) {
		let [fname1, fname2] = rest.map(user => {
			return `${user.surname} ${user.name[0]}.${user.patronymic? user.patronymic[0] + '.' : ''}`
		})
		var result = this.compareStrings(fname1, fname2)
		return order === 'asc'? -result : result
	},

	sortRusStrings: function(key, order, ...rest) { 
		let [rus1, rus2] = rest.map(user => this.rusNames[user[key]] || user[key])
		var result = this.compareStrings(rus1, rus2)
		return order === 'asc'? -result : result
	},

	sortStrings: function(key, order, obj1, obj2) { 
		var result = this.compareStrings(obj1[key], obj2[key])
		return order === 'asc'? -result : result
	},

	sortNumbers: function(key, order, f1, f2) { 
		return order === 'asc'? f1[key] - f2[key] : f2[key] - f1[key] 
	},

	sort: function(event) {
		var target = event.target.tagName === 'SPAN'? 
			event.target.parentElement :
			event.target;

		if(target.tagName !== 'TH')
			return;

		var columns = this.state.columns;
		var key = target.id;
		var clicked = target.cellIndex;
		var newOrder = columns[clicked].sortOrder === 'asc' ? 'desc' : 'asc';
		columns[clicked] = Object.assign(columns[clicked], { sortOrder: newOrder });
		
		this.setState({ 
			forms: this.state.forms.sort(columns[clicked].sort.bind(this, key, newOrder)),
			columns: columns 
		})
		
	},
	

	getInitialState: function() { 
		return ({
			columns: [
				{ name: 'index', sortOrder: '', sort: this.sortNumbers },
				{ name: 'author', sortOrder: '', sort: this.sortStrings },
				{ name: 'type', sortOrder: '', sort: this.sortRusStrings },
				{ name: 'title', sortOrder: '', sort: this.sortStrings },
				{ name: 'created', sortOrder: '', sort: this.sortNumbers },
				{ name: 'sent', sortOrder: '', sort: this.sortNumbers },
				{ name: 'expires', sortOrder: '', sort: this.sortNumbers },
				{ name: 'resp_count', sortOrder: '', sort: this.sortNumbers }
			],
			forms: []
		})
	},

	componentDidMount: function() {
		sendRequest('GET', '/api/journal')
			.then(response => { 
				this.setState({ 
					forms: JSON.parse(response, (key, value) => {
						if (key === 'created' || key === 'sent' || key === 'expires') 
							return value? new Date(value) : null;
						return value;
					})
				}) 
			})
			.catch(err => { console.log('xhr err:', err) })
	},

	showList: function(forms) {
		return (
			<table className="table table-bordered table-hover">
				<thead onClick={this.sort}>
					<Columns columns={this.state.columns} rusNames={this.rusNames}/>
				</thead>
				<tbody>
					{forms.map(
						(form, i) => {
							return <Form key={form.id} form={form} rusNames={this.rusNames}/>
						}
					)}
				</tbody>
			</table>
		)
	},

	render: function() {
		var forms = this.state.forms;
		return (
			<div id="journal" className="table-responsive">
				{forms.length ? 
					this.showList(forms) : 
					<p>Форм не найдено.</p>}
			</div>
		)
	}
})


var App = React.createClass({
	render: function() {
		return (
			<Forms />
		)
	}
})



ReactDOM.render(
  <App />,
  document.getElementById('root')
);
