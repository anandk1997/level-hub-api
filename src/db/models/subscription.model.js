'use strict';

const { Model } = require('sequelize');

/**
 * Subscription Model Defination
 * 
 * @typedef {import('sequelize').Model} Model
 * @typedef {import('sequelize').Sequelize} Sequelize
 *
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @param {import('sequelize').DataTypes} DataTypes - Sequelize DataTypes
 * @returns {import('sequelize').Model} - Subscription model
 */
module.exports = (sequelize, DataTypes) => {
  class Subscriptions extends Model {
    static associate(models) {
      Subscriptions.belongsTo(models.Plans, { foreignKey: 'planId', as: 'plan' });
      Subscriptions.belongsTo(models.Plans, { foreignKey: 'scheduledPlanId', as: 'scheduledPlan' });
      Subscriptions.belongsTo(models.Users, {
        foreignKey: 'userId',
        onDelete: 'CASCADE', // Delete level when the user is deleted,
      });
    }
  }
  Subscriptions.init({
    userId: {
      type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'users',
				key: 'id'
			},
			onDelete: 'CASCADE'
    },
    planId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
				model: 'plans',
				key: 'id'
			},
    },
    interval: {
      type: DataTypes.ENUM('month','year'),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    priceCentsSnapshot: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    currencySnapshot: {
      type: DataTypes.STRING(8),
      defaultValue: 'usd',
    },
    stripeCustomerId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    stripeSubscriptionId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    stripePriceIdSnapshot: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING
    },    
    isFreemium: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    currentPeriodStart: {
      type: DataTypes.DATE,
      allowNull: false
    },
    currentPeriodEnd: {
      type: DataTypes.DATE,
      allowNull: false
    },
    scheduledPlanId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
				model: 'plans',
				key: 'id'
			},
    },
    scheduledInterval: {
      type: DataTypes.ENUM('month','year'),
      allowNull: false
    },
    scheduledEffectiveAt: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  }, {
    timestamps: true,
    paranoid: true,
    sequelize,
    modelName: 'Subscriptions',
    tableName: 'subscriptions'
  });
  return Subscriptions;
};