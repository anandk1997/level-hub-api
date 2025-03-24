'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const {
  DB_HOST,
  DB_NAME,
  DB_PASSWORD,
  DB_USERNAME,
  DB_PORT,
} = require("../../../config");

// /**
//  * @type {Object.<string, import('sequelize').Model>}
//  * @property {Sequelize.Sequelize} sequelize - Sequelize instance
//  * @property {typeof Sequelize} Sequelize - Sequelize library
//  * @property {Users} Users - Users model
//  */

/**
 * @typedef {Object} DBModels
 * @property {Sequelize.Sequelize} sequelize - Sequelize instance
 * @property {typeof Sequelize} Sequelize - Sequelize library
 * @property {Users} Users - Users model
 * @property {Roles} Roles - Roles model
 * @property {UserOtps} UserOtps - UserOTPs model
 * @property {UserConfig} UserConfig - UserConfig model
 * @property {Levels} Levels - Levels model
 */

/** @type {DBModels} */
const db = {};

/**
 * @type {import('sequelize').Sequelize}
 */
const sequelize = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: "postgres",
  // logging: false,
  ssl: {
    require: process.NODE_ENV !== 'development' ? true : false,
    rejectUnauthorized: false,
  },
});

sequelize
  .authenticate()
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.error("Database connection error:", err));

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    /**
     * @type {import('sequelize').Model}
     */
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// sequelize.sync({ force: false });
// sequelize.sync({ alter: true, force: false });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// console.log(db);

module.exports = db;
