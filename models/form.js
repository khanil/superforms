var config = require('../config');
var db = require('./db.js')
var Hashids = require("hashids");
var hashids = new Hashids(config.get("hash:form:salt"), config.get("hash:form:length"));


function Form() {

	this.findOne = function (id) {
	 	return db.query('SELECT * FROM forms WHERE id = $1;', [id]);
	}

	this.findAll = function (user_id) {
		return db.query('SELECT * FROM forms WHERE user_id = $1;', [user_id], true);
	}


	this.add = function (user, form) {
		return db.query("INSERT INTO forms(user_id, json) values($1, $2) RETURNING id;", [user, form]);
	}

	this.update = function (id, updatedFields) {
		var result = db.generateQueryString.call(self, updatedFields, id);
		return db.query(result.queryString, result.values);
	}

	this.delete = function (id) {
		return db.query("DELETE FROM forms WHERE id = $1;", [id]);
	}

	this.getHash = function (id) {
		return hashids.encode(id);
	}

	this.getIdFromParams = function (params) {
		return params.id?
			+hashids.decode(params.id) :
			null;
	}

	this.JsonForClient = function (formRow, withQuestions) {
		this.id = hashids.encode(formRow.id);
		this.name = formRow.json.name;
		this.description = formRow.json.description;
		this.type = formRow.json.type;
		this.created = formRow.created;
		this.edited = formRow.edited;
		this.sent = formRow.sent;
		this.expires = formRow.expires;
		this.expireDate = formRow.expiredate;
		this.allowRefill = formRow.allowrefill;
		if(withQuestions) {
			this.questions = formRow.json.questions;
		}
	}

	var self = this;
	this.table = 'forms';
	this.name = 'form';
	
}

module.exports = new Form();