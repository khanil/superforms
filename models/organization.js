var config = require('../config');
var db = require('./db.js');

function Organization() {

	this.add = (name) => {
		return db.query('INSERT INTO organizations(name) VALUES($1);', [name])
	}

	this.table = 'organiztions';
	
}

module.exports = new Organization();