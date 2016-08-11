var config = require('../config');
var db = require('./db')
var Hashids = require("hashids");
var hashids = new Hashids(config.get("hash:form:salt"), config.get("hash:form:length"));
var Object = require('../libs/improvedObject') 
var user = require('./user')

function Form() {

	this.findOne = function (id) {
	 	return db.query('SELECT * FROM forms WHERE id = $1;', [id]);
	}

	this.findAll = function (user_id) {
		return db.query('SELECT * FROM forms WHERE user_id = $1;', [user_id], true);
	}


	this.add = function (user, form) {
		return db.query("INSERT INTO forms(user_id, template) values($1, $2) RETURNING id;", [user, form]);
	}

	this.update = (id, updatedFields) => {
		var result = db.generateUpdateQuery.call(this, updatedFields, id);
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

	this.modifyForClient = function (form, withQuestions) {
		form.id = hashids.encode(form.id);
		form.user_id = user.getHash(form.user_id);
		Object.renameProperty.call(form, 'allowrefill', 'allowRefill')
		Object.renameProperty.call(form, 'template', 'scheme')
	}

	this.table = 'forms';
	this.name = 'form';
	
}

module.exports = new Form();