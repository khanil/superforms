var config = require('../config');
var db = require('./db.js');
var Hashids = require("hashids");
var hashids = new Hashids(config.get("hash:response:salt"), config.get("hash:response:length"));


exports.findOne = function (id) {
  return db.query('SELECT * FROM responses WHERE id = $1', [id]);
}

exports.findAll = function (formID) {
  return db.query('SELECT * FROM responses WHERE form_id = $1', [formID], true);
}

exports.add = function (answers, formID) {
	// console.log('formid: ', formId);
  return db.query("INSERT INTO responses(json, form_id) values($1, $2) RETURNING id", [answers, formID]);
}

exports.getID = function (params) {
	return params.response_id?
		+hashids.decode(params.response_id) :
		null;
}

exports.getHash = function (id) {
	return hashids.encode(id);
}


exports.JsonForClient = function JsonForClient(responseRow) {
	this.id = hashids.encode(responseRow.id);
	this.author = responseRow.json["Автор"];
	this.received = responseRow.received;
	this.answers = responseRow.json;
}

// exports.JsonForClient = function JsonForClient(questions, responseRow) {
// 	var i = 0, 
// 			self = this;

// 	this.id = hashids.encode(responseRow.id);
//  	this['Автор'] = responseRow.json[i++];
//  	questions.forEach(question => {
//  		self[question.title] = responseRow.json[i++];
//  	})
// }

exports.jsonForClient = function (questions, responseRow) {
	// responseRow.json.id = hashids.encode(responseRow.id);
	// return responseRow.json;
	return new JsonForClient(questions, responseRow);
}
