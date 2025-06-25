'use strict';

const { Model } = require('sequelize');

/**
 * Target Model Defination
 * 
 * @typedef {import('sequelize').Model} Model
 * @typedef {import('sequelize').Sequelize} Sequelize
 * 
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @param {import('sequelize').DataTypes} DataTypes - Sequelize DataTypes
 * @returns {import('sequelize').Model} - Targets model
 */
module.exports = (sequelize, DataTypes) => {
  class Targets extends Model {
    static associate(models) {
      Targets.belongsTo(models.Users, {
        foreignKey: 'userId',
        onDelete: 'CASCADE' // Delete level when the user is deleted
      });
    }
  }
  Targets.init({
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
		targetXP: {
			type: DataTypes.INTEGER,
			allowNull: false,
      defaultValue: 1000,
      comment: "The amount of Experience Points (XP) required to level up"
		},
  }, {
    timestamps: true,
    sequelize,
    modelName: 'Targets',
    tableName: 'targets',
  });
  return Targets;
};