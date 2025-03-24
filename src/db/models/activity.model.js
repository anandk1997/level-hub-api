'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Activities extends Model {
    static associate(models) {
      Activities.belongsTo(models.Users, {
        foreignKey: 'userId',
        onDelete: 'CASCADE' // Delete level when the user is deleted
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
        DataTypes.ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
      ),
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
    approvedBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    approvedById: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    approvalDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    timestamps: true,
    sequelize,
    modelName: 'activities',
    tableName: 'Activities',
  });
  return Activities;
};