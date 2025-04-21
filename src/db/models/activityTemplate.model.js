'use strict';

const { Model } = require('sequelize');

/**
 * Activity Templates Model Defination
 * 
 * @typedef {import('sequelize').Model} Model
 * @typedef {import('sequelize').Sequelize} Sequelize
 *
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @param {import('sequelize').DataTypes} DataTypes - Sequelize DataTypes
 * @returns {import('sequelize').Model} - ActivityTemplate model
 */
module.exports = (sequelize, DataTypes) => {
  class ActivityTemplates extends Model {
    static associate(models) {
      ActivityTemplates.belongsTo(models.Users, {
        foreignKey: 'userId',
        onDelete: 'CASCADE', // Delete template when the user is deleted,
      });
    }
  }
  ActivityTemplates.init({
    title: {
      type: DataTypes.STRING,
			allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
			allowNull: true,
    },
    videoLink: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true
      }
    },
    xp: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Experience Points'
    },
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
  }, {
    timestamps: true,
    sequelize,
    modelName: 'ActivityTemplates',
    tableName: 'activityTemplates',
  });
  return ActivityTemplates;
};