'use strict';

const { Model } = require('sequelize');

/**
 * User Progress Model Defination
 * 
 * @typedef {import('sequelize').Model} Model
 * @typedef {import('sequelize').Sequelize} Sequelize
 * 
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @param {import('sequelize').DataTypes} DataTypes - Sequelize DataTypes
 * @returns {import('sequelize').Model} - UserProgress model
 */
module.exports = (sequelize, DataTypes) => {
  class UserProgress extends Model {
    static associate(models) {
      UserProgress.belongsTo(models.Users, {
        foreignKey: 'userId',
        onDelete: 'CASCADE' // Delete level when the user is deleted
      });
    }
  }
  UserProgress.init({
    userId: {
			type: DataTypes.INTEGER,
			allowNull: false,
      unique: true,
			references: {
				model: 'users',
				key: 'id'
			},
			onDelete: 'CASCADE'
		},
    currentXP: {
			type: DataTypes.INTEGER,
			allowNull: false,
      defaultValue: 0,
      comment: "The current XP of the user"
		},
  }, {
    timestamps: true,
    sequelize,
    modelName: 'UserProgress',
    tableName: 'userProgress',
  });
  return UserProgress;
};