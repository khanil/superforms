var config = require('../config');
var db = require('./db.js')
var Hashids = require("hashids");
var hashids = new Hashids(config.get("hash:form:salt"), config.get("hash:form:length"));


exports.findOne = function (id) {
  return db.query('SELECT * FROM forms WHERE id = $1;', [id]);
}


exports.findAll = function (user_id) {
	return db.query('SELECT * FROM forms WHERE user_id = $1;', [user_id], true);
}


exports.add = function (user, form) {
  return db.query("INSERT INTO forms(user_id, json) values($1, $2) RETURNING id;", [user, form]);
}


exports.update = function (id, updatedFields) {
	var count = 0;
	var values = [];
	var queryString = 'UPDATE forms SET ';
	var keys = Object.keys(updatedFields);
	// create query string from fields that should be updated
	Object.keys(updatedFields).forEach( (key) => {
		if(key === 'edited' || key === 'sent') {
			queryString = queryString + key + ' = current_timestamp, ';
		} else {
			queryString = queryString + key + ' = $' + ++count + ', ';
			values.push(updatedFields[key]);
		}
	})
	queryString = queryString.slice(0, -2) + ' WHERE id = $' + ++count + ';';
	values.push(id);

	return db.query(queryString, values);
}


exports.delete = function (id) {
  return db.query("DELETE FROM forms WHERE id = $1;", [id]);
}


exports.getHash = function (id) {
	return hashids.encode(id);
}


exports.getID = function (params) {
	return params.id?
		+hashids.decode(params.id) :
		null;
}


exports.JsonForClient = function (formRow, withQuestions) {
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