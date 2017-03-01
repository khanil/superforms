

function User() {
	var config = require('../config');
	var CryptoJS = require('../libs/cryptoJS')
	var db = require('./db.js');
	const {Object} = require('../libs/extraMethods');
	var HttpError = require('../error').HttpError;
	var Hashids = require("hashids");
	var hashids = {
		user : new Hashids(config.get('hash:user:salt'), config.get('hash:user:length')),
		registration : new Hashids(config.get('hash:user:salt'), config.get('hash:regConfirm:length')),
		recovery : new Hashids(config.get('hash:user:salt'), config.get('hash:regConfirm:length'))
	}
	
	this.naming = this.constructor.name;
	this.table = 'users';
	this.name = 'user';
	this.passwordSource = {
		specials : '!@#$%&*_?',
		lowercase : 'abcdefghijklmnopqrstuvwxyz',
		uppercase : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
		numbers : '0123456789',
	};

	// generate secure password
	this.genPassword = () => {
		var source = this.passwordSource;
		var all = source.specials + source.lowercase + source.uppercase + source.numbers;
		var newPass = 
			source.specials.pick(1) + 
			source.lowercase.pick(1) + 
			source.uppercase.pick(1) + 
			source.numbers.pick(1) +
			all.pick(5, 7);
		return newPass.shuffle();
	};

	// find user by id(number) or email(string)
	this.findOne = unique => db.query(
		`SELECT orgs.id AS org_id, orgs.name AS organization, users.*, roles.name AS role,
			status.name AS status, status.id AS status_id, logs.changed AS status_changed
		FROM user_status_logs AS logs
		JOIN users ON users.id = logs.user_id
		JOIN status ON status.id = logs.status_id
		JOIN user_roles ON user_roles.user_id = logs.user_id
		JOIN roles ON roles.id = user_roles.role_id
		JOIN organizations AS orgs ON orgs.id = user_roles.organization_id ${typeof unique === 'number'?
			'WHERE logs.changed = (SELECT MAX(changed) FROM user_status_logs logs WHERE logs.user_id = $1);' :
			'WHERE users.email = $1 AND logs.changed = (SELECT MAX(changed) FROM user_status_logs logs WHERE logs.user_id = users.id);'}`,
		[unique]
	)


	this.findAll = () => db.query(
		`SELECT users.id, users.surname, users.name, users.patronymic, users.email, roles.name AS role,
			status.name AS status, logs.changed AS status_changed
		FROM user_status_logs AS logs
		JOIN users ON users.id = logs.user_id
		JOIN status ON status.id = logs.status_id
		JOIN user_roles ON user_roles.user_id = logs.user_id
		JOIN roles ON roles.id = user_roles.role_id
		WHERE logs.changed IN (SELECT MAX(changed) FROM user_status_logs logs GROUP BY user_id)
		ORDER BY users.id;`, 
		[], true
	)


	this.add = user => {
		user.password = user.password || this.genPassword()
		var salt = this.genSalt()
		var hash = CryptoJS.SHA3(user.password, salt)
		return db.query(
			'INSERT INTO users(name, surname, patronymic, email, hash) VALUES($1, $2, $3, $4, $5) RETURNING id;', 
			[user.name, user.surname, user.patronymic, user.email, salt + '$' + hash]
		)
	}

	this.addRole = (user_id, role='employee') => db.query(
		'INSERT INTO user_roles(user_id, role_id)\
		VALUES($1, (SELECT id FROM roles WHERE name = $2))\
		RETURNING user_id AS id;', [user_id, role]
	)

	this.changePassword = user => {
		user.password = user.password || this.genPassword()
		var salt = this.genSalt()
		var hash = CryptoJS.SHA3(user.password, salt)
		return db.query(
			'UPDATE users SET hash=$2 WHERE id=$1;', 
			[user.id, salt + '$' + hash]
		)
	}

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
			VALUES($1, $2) RETURNING *;', [user_id, regToken]
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

	this.encrypt = (data, salt) => {
		return CryptoJS.AES.encrypt(data, salt).toString()
	}

	this.decrypt = (hash, salt) => {
		var user = CryptoJS.AES.decrypt(hash, salt).toString(CryptoJS.enc.Utf8);
		if(user) {
			return user;
		}
		throw new Error('incorrect user\'s hash')
	}

	this.genSalt = (length=32) => {
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