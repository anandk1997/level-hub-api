'use strict';

const { DB_HOST, DB_NAME, DB_USERNAME, DB_PASSWORD, DB_PORT } = require('../../../config')

module.exports = {
  development: {
    username: DB_USERNAME || 'admin',
    password: DB_PASSWORD || 'admin',
    database: DB_NAME || 'levelhub',
    host: DB_HOST || 'localhost',
    port: DB_PORT || 5432,
    dialect: 'postgres',
  },
};
