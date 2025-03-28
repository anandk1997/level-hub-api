'use strict';

const { Model } = require('sequelize');
const { DAYS } = require('../../constants');

const { MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY } = DAYS;

/**
 * @typedef {import('sequelize').Model} Model
 * @typedef {import('sequelize').Sequelize} Sequelize
 */
module.exports = (sequelize, DataTypes) => {
  class ActivityHistory extends Model {
    static associate(models) {
      ActivityHistory.belongsTo(models.Activities, {
        foreignKey: 'activityId',
        onDelete: 'CASCADE', // Delete level when the user is deleted,
      });
      ActivityHistory.belongsTo(models.Users, {
        foreignKey: 'assigneeId',
        onDelete: 'CASCADE', // Delete level when the user is deleted,
        as: "assignee" 
      });
      ActivityHistory.belongsTo(models.Users, {
        foreignKey: 'assignedById',
        as: "assignedBy"
      });
      ActivityHistory.belongsTo(models.Users, {
        foreignKey: 'approvedById',
        as: "approvedBy"
      });
    }
  }
  ActivityHistory.init({
    activityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'activities',
        key: "id",        
      },
      onDelete: "CASCADE",
    },  
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
    assigneeId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'users',
				key: 'id'
			},
			onDelete: 'CASCADE'
		},
    assignedById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },    
    approvalDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    approvalDay: {
      type: DataTypes.ENUM(MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY),
      allowNull: false
    },
    approvedByName: {
      type: DataTypes.STRING, // Name of the person who approved the completion
      allowNull: false,
    },
    approvedById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
  }, {
    timestamps: true,
    sequelize,
    modelName: 'ActivityHistory',
    tableName: 'activityHistory',
  });
  return ActivityHistory;
};