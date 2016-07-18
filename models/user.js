var config = require('../config');
var bcrypt = require('bcryptjs');
var db = require('./db.js');
var Hashids = require("hashids");
var hashids = new Hashids(config.get("hash:user:salt"), config.get("hash:user:length"));


exports.findByMail = function (email) {
	return db.query('SELECT * FROM users WHERE email = $1;', [email]);
}

exports.findOne = function (id) {
	return db.query('SELECT * FROM users WHERE id = $1;', [id]);
}

exports.add = function (user) {
	var salt = bcrypt.genSaltSync(10);
	var hash = bcrypt.hashSync(user.password, salt);

	return db.query("INSERT INTO users(email, password) values($1, $2) RETURNING id;", [user.email, hash]);
}


exports.getHash = function (id) {
	return hashids.encode(id);
}

exports.getID = function (session) {
	return session.user?
		+hashids.decode(session.user) :
		null;
}

exports.compare = function (password, hash) {
	return bcrypt.compareSync(password, hash);
}