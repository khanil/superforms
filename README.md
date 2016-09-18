#Superforms

Node.js web-app that allows to generate survey forms, send them, collect responses and export data to XLSX.

#Installation

1. Install [Node.js](https://nodejs.org/en/) (version >= v5.2.0).

2. Install [PostgreSQL](https://www.postgresql.org/download/) (version >= 9.4.0).

3. Create database and change the db connection settings in config/config.json to your own. The connection string has the following format:
  `postgres://username:password@localhost:port/database_name`.
  
4. Install dependencies using npm from application folder:
  `npm install`.
  
5. Run it:
  `node server.js` or `supervisor server.js` and see on [localhost:3000](http://localhost:3000/).
