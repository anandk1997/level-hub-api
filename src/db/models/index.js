'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const pg = require("pg"); 

const basename = path.basename(__filename);
const {
  DB_HOST,
  DB_NAME,
  DB_PASSWORD,
  DB_USERNAME,
  DB_PORT,
} = require("../../../config");

/**
 * @typedef {import('sequelize').Model} Targets
 * @typedef {import('sequelize').Model} UserProgress
 * @typedef {import('sequelize').Model} Users
 * @typedef {import('sequelize').Model} Roles
 * @typedef {import('sequelize').Model} UserOtps
 * @typedef {import('sequelize').Model} UserConfig
 * @typedef {import('sequelize').Model} Activities
 * @typedef {import('sequelize').Model} ActivityHistory
 * @typedef {import('sequelize').Model} ActivityTemplates
 * @typedef {import('sequelize').Model} Permissions
 * @typedef {import('sequelize').Model} UserAssociations
 * @typedef {import('./rolePermission.model').Model} RolePermissions
*/


/**
 * @typedef {Object} DBModels
 * @property {Sequelize.Sequelize} sequelize - Sequelize instance
 * @property {typeof Sequelize} Sequelize - Sequelize library
 * @property {Targets} Targets - Targets model
 * @property {UserProgress} UserProgress - UserProgress model
 * @property {Users} Users - Users model
 * @property {Roles} Roles - Roles model
 * @property {UserOtps} UserOtps - UserOTPs model
 * @property {UserConfig} UserConfig - UserConfig model
 * @property {Activities} Activities - Activities model
 * @property {ActivityHistory} ActivityHistory - ActivityHistory model
 * @property {ActivityTemplates} ActivityTemplates - ActivityTemplates model
 * @property {Permissions} Permissions - Permissions model
 * @property {RolePermissions} RolePermissions - RolePermissions model
 * @property {UserAssociations} UserAssociations - UserAssociations model
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
  /* dialectOptions: {
    useUTC: false,
    dateStrings: true,
    timezone: '+00:00',
    typeCast: function (field, next) {
      if (field.type === 'DATETIME') {
        return field.string()
      }
      return next()
    },
  }, */
  logging: process.env.NODE_ENV === 'development',
  ssl: {
    require: process.env.NODE_ENV !== 'development' ? true : false,
    rejectUnauthorized: false,
  },
});

/* sequelize
  .authenticate()
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.error("Database connection error:", err)); */

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
