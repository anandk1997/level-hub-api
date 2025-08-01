'use strict';

const { Model } = require('sequelize');
const { USER_ASSOCIATIONS: { PARENT_CHILD, ORGANIZATION_USER, GYM_COACH } } = require('../../constants');


/**
 * UserAssociation Model Defination
 * 
 * @typedef {import('sequelize').Model} Model
 * @typedef {import('sequelize').Sequelize} Sequelize
 *
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @param {import('sequelize').DataTypes} DataTypes - Sequelize DataTypes
 * @returns {import('sequelize').Model} - UserAssociation model
 */
module.exports = (sequelize, DataTypes) => {
  class UserAssociations extends Model {
    static associate(models) {
      UserAssociations.belongsTo(models.Users, { foreignKey: "primaryUserId", as: 'primaryUser', onDelete: 'CASCADE' });
      UserAssociations.belongsTo(models.Users, { foreignKey: "associatedUserId", as: 'associatedUser', onDelete: 'CASCADE' });
    }
  }
  UserAssociations.init({
    primaryUserId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
				model: 'users',
				key: 'id'
			},
			onDelete: 'CASCADE'
    },
    associatedUserId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
				model: 'users',
				key: 'id'
			},
			onDelete: 'CASCADE'
    },
    relationType: {
      type: DataTypes.ENUM,
      values: [PARENT_CHILD, ORGANIZATION_USER, GYM_COACH],
      allowNull: false,
    }
  }, {
    timestamps: false,
    sequelize,
    modelName: 'UserAssociations',
    tableName: 'userAssociations'
  });
  return UserAssociations;
};