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
 * @typedef {Object} DBModels
 * @property {Sequelize.Sequelize} sequelize - Sequelize instance
 * @property {typeof Sequelize} Sequelize - Sequelize library
 * @property {import('./target.model').Model} Targets - Targets model
 * @property {import('./userProgress.model').Model} UserProgress - UserProgress model
 * @property {import('./user.model').Model} Users - Users model
 * @property {import('./role.model').Model} Roles - Roles model
 * @property {import('./userotp.model').Model} UserOtps - UserOTPs model
 * @property {import('./userConfig.model').Model} UserConfig - UserConfig model
 * @property {import('./activity.model').Model} Activities - Activities model
 * @property {import('./activityHistory.model').Model} ActivityHistory - ActivityHistory model
 * @property {import('./activityTemplate.model').Model} ActivityTemplates - ActivityTemplates model
 * @property {import('./permission.model').Model} Permissions - Permissions model
 * @property {import('./rolePermission.model').Model} RolePermissions - RolePermissions model
 * @property {import('./userAssociation.model').Model} UserAssociations - UserAssociations model
 * @property {import('./invite.model').Model} Invites - Invites model
 * @property {import('./plan.model').Model} Plans - Plans model
 * @property {import('./subscription.model').Model} Subscriptions - Subscriptions model
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
