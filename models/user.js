function User() {
	var config = require('../config');
	var CryptoJS = require('../libs/cryptoJS')
	var db = require('./db.js');
	var Object = require('../libs/improvedObject');
	var Hashids = require("hashids");
	var hashids = {
		user : new Hashids(config.get('hash:user:salt'), config.get('hash:user:length')),
		registration : new Hashids(config.get('hash:user:salt'), config.get('hash:regConfirm:length')),
		recovery : new Hashids(config.get('hash:user:salt'), config.get('hash:regConfirm:length'))
	}
	
	var self = this;
	this.table = 'users';
	this.name = 'user';

	// find user by id(number) or email(string)
	this.findOne = unique => db.query(
		'SELECT orgs.id AS org_id, orgs.name AS organization, users.*, roles.name AS role,\
			status.name AS status, status.id AS status_id, logs.changed AS status_changed\
		FROM user_status_logs AS logs\
		JOIN users ON users.id = logs.user_id\
		JOIN status ON status.id = logs.status_id\
		JOIN user_roles ON user_roles.user_id = logs.user_id\
		JOIN roles ON roles.id = user_roles.role_id\
		JOIN organizations AS orgs ON orgs.id = user_roles.organization_id ' + 
		(typeof unique === 'number'?
					'WHERE logs.changed = (SELECT MAX(changed) FROM user_status_logs logs WHERE logs.user_id = $1);' :
					'WHERE users.email = $1 AND logs.changed = (SELECT MAX(changed) FROM user_status_logs logs WHERE logs.user_id = users.id);'), 
		[unique]
	)


	this.findAll = () => db.query(
		'SELECT users.id, users.fullname, users.email, roles.name AS role,\
			status.name AS status, logs.changed AS status_changed\
		FROM user_status_logs AS logs\
		JOIN users ON users.id = logs.user_id\
		JOIN status ON status.id = logs.status_id\
		JOIN user_roles ON user_roles.user_id = logs.user_id\
		JOIN roles ON roles.id = user_roles.role_id\
		WHERE logs.changed IN (SELECT MAX(changed) FROM user_status_logs logs GROUP BY user_id);', 
		[], true
	)

	// SELECT users.*, status.name AS status, status.id AS status_id,
	// 			logs.changed AS status_changed
	// 		FROM users, user_status_logs AS logs, status
	// 		WHERE logs.changed IN (SELECT MAX(changed) FROM user_status_logs GROUP BY user_id)
	// 		AND users.id = logs.user_id AND logs.status_id = status.id;

	this.add = user => db.query(
		'INSERT INTO users(fullname, email, hash) VALUES($1, $2, $3) RETURNING id;', 
		[user.fullname, user.email, user.salt + '$' + user.password]
	)

	this.addRole = (user_id, role='employee') => db.query(
		'INSERT INTO user_roles(user_id, role_id)\
		VALUES($1, (SELECT id FROM roles WHERE name = $2))\
		RETURNING user_id AS id;', [user_id, role]
	)


	this.changeStatus = (user_id, status='waiting') => db.query(
		'INSERT INTO user_status_logs(user_id, status_id)\
		VALUES($1, (SELECT id FROM status WHERE name = $2))\
		RETURNING *;', [user_id, status]
	)

	this.findToken = (token) => db.query(
		'SELECT * FROM registration_tokens WHERE token=$1;', [token]
	)

	this.addRegConfirm = (user_id) => {
		var regToken = this.genSalt(64)
		return db.query(
			'INSERT INTO registration_tokens(user_id, token)\
			VALUES($1, $2) RETURNING token;', [user_id, regToken]
		)
	}

	this.update = (id, updatedFields) => {
		var result = db.generateUpdateQuery.call(this, updatedFields, id);
		return db.query(result.queryString, result.values);
	}

	this.delete = function (id) {
		return db.query('DELETE FROM users WHERE id = $1;', [id]);
	}

	this.compare = function (regHash, hash, salt) {
		hash = hash.split('$')[1];
		return regHash === CryptoJS.HmacSHA3(hash, salt).toString();
	}

	this.encode = function (id) {
		if(typeof(id) === 'number') {
			return hashids.user.encode(id);
		}
		throw new Error('could not get user\'s hash');
	}

	this.decode = function (params) {
		return typeof params === 'string'?
			+hashids.user.decode(params) :
			(params.user_id?
				+hashids.user.decode(params.user_id) :
				null)
	}

	this.decrypt = (hash, salt) => {
		var user = CryptoJS.AES.decrypt(hash, salt).toString(CryptoJS.enc.Utf8);
		if(user) {
			return user;
		}
		throw new Error('incorrect user\'s hash')
	}

	this.genSalt = (length=16) => {
		return CryptoJS.lib.WordArray.random(length).toString()
	}

	this.getSalt = (hash) => {
		return hash.split('$')[0];
	}

	this.getRegConfirmHash = function (userStatusRow) {
		if(userStatusRow.changed instanceof Date) {
			userStatusRow.changed = userStatusRow.changed.getTime();
			var hash = hashids.registration.encode( Object.values(userStatusRow) );
			return hash;
		}
		throw new Error('could not get registration hash')
	}

	this.decodeRegConfirmHash = (hash) => {
		var data = hashids.registration.decode(hash), statusLog = {};
		keys = ['user_id', 'status_id', 'changed'];
		if(typeof data === 'object') {
			keys.forEach((key, i) => statusLog[key] = data[i])
			return statusLog;
		}
		throw new Error('invalid registration confirmation hash')
	}

	this.isAdmin = user => user.role === 'admin';
	
}

module.exports = new User();
