'use strict';

const { Model } = require('sequelize');
const { DAYS } = require('../../constants');

const { MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY } = DAYS;

/**
 * @typedef {import('sequelize').Model} Model
 * @typedef {import('sequelize').Sequelize} Sequelize
 */
module.exports = (sequelize, DataTypes) => {
  class Activities extends Model {
    static associate(models) {
      Activities.belongsTo(models.Users, {
        foreignKey: 'assigneeId',
        onDelete: 'CASCADE', // Delete level when the user is deleted,
        as: "assignee" 
      });
      Activities.belongsTo(models.Users, {
        foreignKey: 'assignedById',
        as: "assignedBy"
      });
    }
  }
  Activities.init({
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
    isRecurring: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    assignedDays: {
      type: DataTypes.ARRAY(
        DataTypes.ENUM(MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY)
      ),
      allowNull: true,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
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
  }, {
    timestamps: true,
    sequelize,
    modelName: 'Activities',
    tableName: 'activities',
    paranoid: true,
  });
  return Activities;
};