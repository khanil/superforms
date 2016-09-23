var sendRequest = require('./xhr')

window.ee = new EventEmitter();


var Columns = React.createClass({
	ruColumns: {
		index: '№',
		author: 'Автор',
		type: 'Назначение',
		title: 'Название',
		created: 'Создана',
		sent: 'Отправлена',
		expires: 'Истекает',
		resp_count: 'Ответы'
	},

	render: function() {
		var columns = this.props.columns;
		return (
			<tr>
				{columns.map(column => 
					(<th 
						key={column.name} 
						id={column.name} 
						title={column.sortOrder? ("Отсортировано по " + (column.sortOrder === 'asc' ? 'возрастанию' : 'убыванию')) : null}>
						{this.ruColumns[column.name]}
						{column.sortOrder ? 
							(<span className={'pull-right glyphicon glyphicon-menu-' + (column.sortOrder === 'asc' ? 'up' : 'down')}></span>) :
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
		var rus = this.props.rus
		return (
			<tr onClick={this.redirect}>
				<td>{ form.index }</td>
				<td>{ form.author }</td>
				<td>{ rus[form.type] }</td>
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
	rus: {
		monitoring: 'мониторинг',
		interview: 'опрос',
		voting: 'голосование',
		survey: 'анкетирование',
	},

	sortNumbers: function(key, order, f1, f2) { 
		return order === 'asc'? f1[key] - f2[key] : f2[key] - f1[key] 
	},

	sortRusTypes: function(key, order, f1, f2) { 
		var type1 = this.rus[f1[key]] || f1[key]
		var type2 = this.rus[f2[key]] || f2[key]
		return order === 'asc'? 
			+(type1 > type2) || +(type1 === type2) - 1 : 
			+(type1 < type2) || +(type1 === type2) - 1
	},

	defaultSort: function(key, order, f1, f2) { 
		return order === 'asc'? 
			+(f1[key] > f2[key]) || +(f1[key] === f2[key]) - 1: 
			+(f1[key] < f2[key]) || +(f1[key] === f2[key]) - 1 
	},
	

	getInitialState: function() { 
		return ({
			columns: [
				{ name: 'index', sortOrder: '', sort: this.sortNumbers },
				{ name: 'author', sortOrder: '', sort: this.defaultSort },
				{ name: 'type', sortOrder: '', sort: this.sortRusTypes },
				{ name: 'title', sortOrder: '', sort: this.defaultSort},
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

	showList: function(forms) {
		return (
			<table className="table table-bordered table-hover">
				<thead onClick={this.sort}>
					<Columns columns={this.state.columns}/>
				</thead>
				<tbody>
					{forms.map(
						(form, i) => {
							return <Form key={form.id} form={form} rus={this.rus}/>
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
