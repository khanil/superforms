var config = require('../config');
var db = require('./db.js');
var Hashids = require("hashids");
var hashids = new Hashids(config.get("hash:response:salt"), config.get("hash:response:length"));


function Response() {

	this.findOne = id => (
		db.query('SELECT * FROM responses WHERE id = $1;', [id])
	)

	this.findAll = form_id => db.query(
		'SELECT * FROM responses WHERE form_id = $1 ORDER BY received DESC;',
		[form_id], 
		true
	)

	this.getResponsesList = form_id => db.query(
		'SELECT list, received FROM responses WHERE form_id = $1 ORDER BY received;',
		[form_id],
		true
	)

	this.add = (answers, form_id) => db.query(
		"INSERT INTO responses(list, form_id) values($1, $2) RETURNING id;", 
		[answers, form_id]
	)

	this.decode = params => (
		params.response_id? +hashids.decode(params.response_id) : null
	)

	this.getHash = id => hashids.encode(id)

	this.modifyForClient = response => {
		response.id = hashids.encode(response.id);
		delete(response.form_id);
		return response;
	}

	var self = this;
	this.table = 'responses';
	this.name = 'response';
	
}

module.exports = new Response();
