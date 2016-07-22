var config = require('../config');
var bcrypt = require('bcryptjs');
var db = require('./db.js');
var Hashids = require("hashids");
var hashids = new Hashids(config.get("hash:user:salt"), config.get("hash:user:length"));


function User() {

	this.findByMail = function (email) {
		return db.query('SELECT * FROM users WHERE email = $1;', [email]);
	}

	this.findOne = function (id) {
		return db.query('SELECT * FROM users WHERE id = $1;', [id]);
	}

	this.add = function (user) {
		var salt = bcrypt.genSaltSync(10);
		var hash = bcrypt.hashSync(user.password, salt);

		return db.query('INSERT INTO users(email, password, status) values($1, $2, $3) RETURNING id;', [user.email, hash, 'waiting']);
	}

	this.update = function (id, updatedFields) {
		var result = db.generateQueryString.call(self, updatedFields, id);
		return db.query(result.queryString, result.values);
	}

	this.getHash = function (id) {
		return hashids.encode(id);
	}

	this.getIdFromParams = function (params) {
		return params.user_id?
			+hashids.decode(params.user_id) :
			null;
	}

	this.getID = function (hash) {
		return +hashids.decode(hash);
	}

	this.compare = function (password, hash) {
		return bcrypt.compareSync(password, hash);
	}

	var self = this;
	this.table = 'users';
	this.name = 'user';
	
}

module.exports = new User();
