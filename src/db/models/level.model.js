'use strict';

const { Model } = require('sequelize');

/**
 * Level Model Defination
 * 
 * @typedef {import('sequelize').Model} Model
 * @typedef {import('sequelize').Sequelize} Sequelize
 * 
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @param {import('sequelize').DataTypes} DataTypes - Sequelize DataTypes
 * @returns {import('sequelize').Model} - Levels model
 */
module.exports = (sequelize, DataTypes) => {
  class Levels extends Model {
    static associate(models) {
      Levels.belongsTo(models.Users, {
        foreignKey: 'userId',
        onDelete: 'CASCADE' // Delete level when the user is deleted
      });
    }
  }
  Levels.init({
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
		levelXP: {
			type: DataTypes.INTEGER,
			allowNull: false,
      defaultValue: 1000,
      comment: "The amount of Experience Points (XP) required to level up"
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
    modelName: 'Levels',
    tableName: 'levels',
  });
  return Levels;
};