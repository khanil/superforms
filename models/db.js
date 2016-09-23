var pg = require('pg');
var config = require('../config');
var connectionString = process.env.DATABASE_URL || config.get('pg:url');
var DatabaseError = require('../error').DatabaseError;
var logger = require('../libs/logger');


pg.defaults.poolIdleTimeout = config.get('pg:poolIdleTimeout');

function query(queryString, data, allRows) {
	// show query to db
	// console.log('NEW QUERY : ' + queryString)
	return new Promise((resolve, reject) => {
		pg.connect(connectionString, (err, client, done) => {
			if(err) { reject(err); }
			// uncomment to show connection pool
			// console.log('connection pool: ', pg.pools.all['"postgres://hellmaker:justdoit@localhost:5432/superforms"'].getPoolSize());
			client.query(queryString, data, (err, result) => {
				done(); 
				if(err) {
					err.__proto__ = DatabaseError.prototype;
					reject(err);
				} else {
					resolve( (allRows) ? result.rows : result.rows[0] );
				}
			});
		});
	})
}


exports.query = query;


exports.generateUpdateQuery = function(updatedFields, id) {
	var queryParts = [];
	var values = [];
	var columns = Object.keys(updatedFields);

	queryParts.push('UPDATE ' + this.table + ' SET ');
	// create query string from fields that should be updated
	columns.forEach( (column, i) => {
		queryParts.push(column + ' = $' + (i + 1) + ', ');
		values.push(updatedFields[column]);
	})
	// join all parts of the query string, delete last substring - ', ' and add query condition 
	values.push(id);
	return {
		queryString : queryParts.join('').slice(0, -2) + ' WHERE id = $' + (columns.length + 1) + ';',
		values : values
	}
}


// create db tables
exports.create = () => {
	return Promise.all([
		createSessionsTable(),
		createStatusTableAndFill(),
		createRolesTableAndFill(),
		createRegConfirmTable(),
		createTables()
	])
	.catch(logger.ERROR);
}


function createTables() {
	return query(
		'CREATE TABLE IF NOT EXISTS organizations(\
			id SERIAL PRIMARY KEY,\
			name VARCHAR(255) UNIQUE\
		);\
		\
		CREATE TABLE IF NOT EXISTS users(\
			id SERIAL PRIMARY KEY,\
			name VARCHAR(255) NOT NULL,\
			surname VARCHAR(255) NOT NULL,\
			patronymic VARCHAR(255),\
			email VARCHAR(255) UNIQUE,\
			hash VARCHAR(161)\
		);\
		\
		CREATE TABLE IF NOT EXISTS user_roles(\
			user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,\
			organization_id INTEGER DEFAULT 1 REFERENCES organizations(id) ON DELETE CASCADE,\
			role_id INTEGER DEFAULT 3 REFERENCES roles(id) ON DELETE CASCADE\
		);\
		\
		CREATE TABLE IF NOT EXISTS user_status_logs(\
			user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,\
			status_id INTEGER DEFAULT 2 REFERENCES status(id) ON DELETE RESTRICT,\
			changed TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp\
		);\
		\
		CREATE TABLE IF NOT EXISTS forms(\
			id SERIAL PRIMARY KEY,\
			user_id SERIAL REFERENCES users ON DELETE CASCADE,\
			template JSON NOT NULL,\
			created TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,\
			edited TIMESTAMP WITH TIME ZONE,\
			sent TIMESTAMP WITH TIME ZONE,\
			expires TIMESTAMP WITH TIME ZONE,\
			allowrefill BOOLEAN DEFAULT FALSE\
		);\
		\
		CREATE TABLE IF NOT EXISTS responses(\
			id SERIAL PRIMARY KEY,\
			form_id INTEGER REFERENCES forms ON DELETE CASCADE,\
			list JSON NOT NULL,\
			received TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp\
		);\
		\
		CREATE TABLE IF NOT EXISTS reports(\
			id SERIAL PRIMARY KEY,\
			form_id SERIAL REFERENCES forms ON DELETE CASCADE,\
			template JSON NOT NULL,\
			created TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp\
		);')
}


function createStatusTableAndFill() {
	return query('\
			CREATE TABLE status(\
				id SERIAL PRIMARY KEY,\
				name VARCHAR(255) UNIQUE\
			);'
		)
		.then( () => query("INSERT INTO status(name) VALUES('waiting'), ('active'), ('banned');"))
		.then( () => { logger.log('INFO', '"status" table has been created and filled.') })
		.catch( (err) => {
			if(err.code !== '42P07') throw err
		})
}


function createRolesTableAndFill() {
	return query('\
			CREATE TABLE roles(\
				id SERIAL PRIMARY KEY,\
				name VARCHAR(255) UNIQUE\
			);'
		)
		.then( () => query("INSERT INTO roles(name) VALUES('root'), ('admin'), ('employee');"))
		.then( () => { logger.log('INFO', '"roles" table has been created and filled.') })
		.catch( (err) => {
			if(err.code !== '42P07') throw err
		})
}


function createSessionsTable() {
	return query(
			'CREATE TABLE sessions (\
				"sid" varchar NOT NULL COLLATE "default",\
				"sess" JSON NOT NULL,\
				"expire" TIMESTAMP(6) NOT NULL\
			) WITH (OIDS=FALSE);'
		)
		.then( () => query(
			'ALTER TABLE sessions \
			ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid")\
			NOT DEFERRABLE INITIALLY IMMEDIATE;')
		)
		.then( () => { logger.log('INFO', '"sessions" table has been created.') })
		.catch( (err) => {
			if(err.code !== '42P07') throw err
		})
}


function createRegConfirmTable() {
	return query(
			'CREATE TABLE registration_tokens (\
				user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,\
				registered timestamp NOT NULL DEFAULT NOW(),\
				token VARCHAR(255) UNIQUE\
			);'
		)
		// .then(() => query(
		// 	'CREATE FUNCTION registration_tokens_delete_old_rows() RETURNS trigger\
		// 		LANGUAGE plpgsql\
		// 		AS $$\
		// 		BEGIN\
		// 			DELETE FROM registration_tokens WHERE registered < NOW() - INTERVAL \'48 hours\';\
		// 			RETURN NEW;\
		// 		END;\
		// 	$$;\
		// 	\
		// 	CREATE TRIGGER registration_confirm_delete_old_rows_trigger\
		// 		AFTER INSERT ON registration_tokens\
		// 		EXECUTE PROCEDURE registration_tokens_delete_old_rows();'
		// 	)
		// )
		.then( () => { logger.log('INFO', '"registration_tokens" table has been created.') })
		.catch( (err) => {
			if(err.code !== '42P07') throw err
		})
}