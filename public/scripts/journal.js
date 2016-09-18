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
		console.log(target)
		while(target.tagName !== 'TR') {
			if(target.tagname === 'TBODY')
				return;
			target = target.parentElement;
		}
		console.log(target)
		document.location.href = '/forms/' + this.props.form.id + '/responses'
	},

	render: function() {
		var form = this.props.form;
		return (
			<tr onClick={this.redirect}>
				<td>{ form.index }</td>
				<td>{ form.author }</td>
				<td>{ form.type }</td>
				<td>{ form.title }</td>
				<td>{ (new Date(form.created)).toLocaleString("ru") }</td>
				<td>{ form.sent? (new Date(form.sent)).toLocaleString("ru") : null }</td>
				<td>{ form.expires? (new Date(form.expires)).toLocaleString("ru") : null }</td>
				<td>{ form.resp_count? form.resp_count : 0 }</td>
			</tr>
		)
	}
});



var Forms = React.createClass({
	getInitialState: () => ({
		columns: [
			{ name: 'index', sortOrder: '' },
			{ name: 'author', sortOrder: '' },
			{ name: 'type', sortOrder: '' },
			{ name: 'title', sortOrder: '' },
			{ name: 'created', sortOrder: '' },
			{ name: 'sent', sortOrder: '' },
			{ name: 'expires', sortOrder: '' },
			{ name: 'resp_count', sortOrder: '' }
		],
		forms: []
	}),

	componentDidMount: function() {
		sendRequest('GET', '/api/journal')
			.then(response => { this.setState({ forms: JSON.parse(response) })})
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
			forms: this.state.forms.sort(
				(u1, u2) => columns[clicked].sortOrder === 'asc' ? u1[key] > u2[key] : u1[key] < u2[key]
			),
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
							return <Form key={form.id} form={form} />
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
