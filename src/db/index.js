'use strict';

const db = require('./models');

module.exports = { db };

// const { Sequelize } = require('sequelize');
// const { DB_HOST, DB_NAME, DB_PASSWORD, DB_USERNAME } = require('../config.js');

// const sequelize = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, {
//   host: DB_HOST,
//   dialect: 'postgres',
// });

// sequelize.sync();

// module.exports = sequelize;