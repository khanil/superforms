var pg = require('pg');
var config = require('../config');
var connectionString = process.env.DATABASE_URL || config.get('pg:url');
var logger = require('../libs/logger');


pg.defaults.poolIdleTimeout = config.get('pg:poolIdleTimeout');


function query(queryString, data, allRows) {
	// show query to db
	// console.log('NEW QUERY : ' + queryString)
	return new Promise((resolve, reject) => {

		pg.connect(connectionString, (err, client, done) => {
			if(err) { reject(err); }

			// show connection pool
			// console.log('all: ', pg.pools.all['"postgres://hellmaker:justdoit@localhost:5432/superforms"'].getPoolSize());

	    client.query(queryString, data, (err, result) => {
	    	// if(err) {}
	    	done();  
        (err) ? reject(err) : resolve( (allRows) ? result.rows : result.rows[0] );
      });
	  });
	  
  })
}


exports.query = query;

// create db tables
exports.create = () => {

	query('\
		CREATE TABLE IF NOT EXISTS users(\
			id SERIAL PRIMARY KEY,\
			email VARCHAR(60) UNIQUE,\
			password VARCHAR(60),\
			registered TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,\
			status VARCHAR(10)\
		);\
		CREATE TABLE IF NOT EXISTS forms(\
			id SERIAL PRIMARY KEY,\
			user_id SERIAL REFERENCES users ON DELETE CASCADE,\
			json JSON NOT NULL,\
			recipients JSON,\
			created TIMESTAMP WITH TIME ZONE DEFAULT current_timestamp,\
			edited TIMESTAMP WITH TIME ZONE,\
			sent TIMESTAMP WITH TIME ZONE,\
			expires TIMESTAMP WITH TIME ZONE,\
			allowrefill BOOLEAN DEFAULT FALSE\
		);\
		CREATE TABLE IF NOT EXISTS responses(\
			id SERIAL PRIMARY KEY,\
			form_id SERIAL REFERENCES forms ON DELETE CASCADE,\
			json JSON NOT NULL,\
			received TIMESTAMP(6) WITH TIME ZONE DEFAULT current_timestamp\
		);\
		CREATE TABLE IF NOT EXISTS reports(\
			id SERIAL PRIMARY KEY,\
			form_id SERIAL REFERENCES forms ON DELETE CASCADE,\
			json JSON NOT NULL,\
			created TIMESTAMP(6) WITH TIME ZONE DEFAULT current_timestamp\
		);'
	)
	['catch'](err => {
		logger.error('Database query: ' + queryString + '\nQuery error: ', err);
	})

	query('SELECT * FROM sessions;')
		["catch"](err => {
			logger.info('creating "sessions" table...');
			query('\
				CREATE TABLE IF NOT EXISTS "sessions" (\
			  	"sid" varchar NOT NULL COLLATE "default",\
					"sess" JSON NOT NULL,\
					"expire" TIMESTAMP(6) NOT NULL\
				) WITH (OIDS=FALSE);\
				ALTER TABLE "sessions" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;'
			)
			.then(() => { logger.info('"sessions" table has been created.') })
			['catch'](err => {
				logger.error('Database query: ' + queryString + '\nQuery error: ', err);
			})
		})
		
}