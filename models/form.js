var config = require('../config');
var db = require('./db')
var Hashids = require("hashids");
var hashids = new Hashids(config.get("hash:form:salt"), config.get("hash:form:length"));
const {Object} = require('../libs/extraMethods');
var user = require('./user')


function Form() {

	this.findOne = function (id) {
	 	return db.query('SELECT * FROM forms WHERE id = $1;', [id]);
	}

	this.findAllForUser = user_id => db.query(
			`SELECT forms.*, responses.resp_count
			FROM (
				SELECT forms.id,
					forms.template::json->>'title' AS title,
					forms.template::json->>'type' AS type,
					forms.template::json->>'description' AS description,
					forms.template::json->>'basis' AS basis,
					forms.template::json->>'basisname' AS basisname,
					forms.created, forms.edited, forms.sent, forms.expires, forms.allowrefill
				FROM forms
				WHERE forms.user_id = $1
			) AS forms
			LEFT JOIN (
				SELECT COUNT(*) AS resp_count, form_id FROM responses 
				GROUP BY form_id
			) AS responses ON responses.form_id = forms.id
			ORDER BY forms.id DESC;`, [user_id], true);


	this.findAllForOrg = org_id => db.query(
			`SELECT users.name, users.surname, users.patronymic, forms.*, responses.resp_count
			FROM (
				SELECT forms.id, forms.user_id,
					forms.template::json->>'title' AS title,
					forms.template::json->>'type' AS type,
					forms.template::json->>'description' AS description,
					forms.template::json->>'basis' AS basis,
					forms.template::json->>'basisname' AS basisname,
					forms.created, forms.edited, forms.sent, forms.expires, forms.allowrefill
				FROM forms
				WHERE forms.user_id IN (
					SELECT user_id FROM user_roles WHERE organization_id = $1
				)
			) AS forms
			JOIN users ON users.id = forms.user_id
			LEFT JOIN (
				SELECT COUNT(*) AS resp_count, form_id FROM responses 
				GROUP BY form_id
			) AS responses ON responses.form_id = forms.id
			ORDER BY forms.id DESC;`, [org_id], true);


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

	this.encode = function (id) {
		return hashids.encode(id);
	}

	this.decode = function (params) {
		return params.id?
			+hashids.decode(params.id) :
			null;
	}

	this.modifyForJournal = form => {
		form.author = `${form.surname} ${form.name[0]}.${form.patronymic? form.patronymic[0] + '.' : ''}`
		form.index = form.id;
		form.id = hashids.encode(form.id);
		form.user_id = user.encode(form.user_id);
	}

	this.modifyForClientWithoutItems = form => {
		form.index = form.id;
		form.id = hashids.encode(form.id);
	}

	this.modifyForClient = function (form) {
		form.id = hashids.encode(form.id)
		form.user_id = user.encode(form.user_id)
		Object.renameProperty.call(form, 'template', 'scheme')
		return form
	}

	this.table = 'forms';
	this.name = 'form';
	
}

module.exports = new Form();