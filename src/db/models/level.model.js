'use strict';

const { Model } = require('sequelize');

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
			references: {
				model: 'users',
				key: 'id'
			},
			onDelete: 'CASCADE'
		},
		levelXP: {
			type: DataTypes.INTEGER,
			allowNull: false,
      defaultValue: 1000
		},
		currentXP: {
			type: DataTypes.INTEGER,
			allowNull: false,
      defaultValue: 0
		},
  }, {
    timestamps: true,
    sequelize,
    modelName: 'Levels',
    tableName: 'levels',
  });
  return Levels;
};