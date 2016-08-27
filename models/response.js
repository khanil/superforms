var config = require('../config');
var db = require('./db.js');
var Hashids = require("hashids");
var hashids = new Hashids(config.get("hash:response:salt"), config.get("hash:response:length"));


function Response() {

	this.findOne = function (id) {
		return db.query('SELECT * FROM responses WHERE id = $1', [id]);
	}

	this.findAll = function (formID) {
		return db.query('SELECT * FROM responses WHERE form_id = $1', [formID], true);
	}

	this.getResponsesList = function (formID) {
		return db.query('SELECT list FROM responses WHERE form_id = $1', [formID], true);
	}

	this.add = function (answers, formID) {
	  return db.query("INSERT INTO responses(list, form_id) values($1, $2) RETURNING id", [answers, formID]);
	}

	this.getIdFromParams = function (params) {
		return params.response_id?
			+hashids.decode(params.response_id) :
			null;
	}

	this.getHash = function (id) {
		return hashids.encode(id);
	}


	this.modifyForClient = function (response) {
		response.id = hashids.encode(response.id);
		delete(response.form_id);
		return response;
	}
	

	var self = this;
	this.table = 'responses';
	this.name = 'response';
	
}

module.exports = new Response();
