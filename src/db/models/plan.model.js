'use strict';

const { Model } = require('sequelize');
const { CURRENCY } = require('../../../config');

/**
 * Plans Model Defination
 * 
 * @typedef {import('sequelize').Model} Model
 * @typedef {import('sequelize').Sequelize} Sequelize
 *
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @param {import('sequelize').DataTypes} DataTypes - Sequelize DataTypes
 * @returns {import('sequelize').Model} - Plans model
 */
module.exports = (sequelize, DataTypes) => {
  class Plans extends Model {
    static associate(models) {
      Plans.belongsTo(models.Roles, { foreignKey: 'roleId' });
      Plans.hasMany(models.Subscriptions, { foreignKey: 'planId', as: 'plan' });
      Plans.hasMany(models.Subscriptions, { foreignKey: 'scheduledPlanId', as: 'scheduledPlan' });
    }
  }
  Plans.init({
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
				model: 'roles',
				key: 'id'
			},
    },
    tier: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    minUsers: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
    },
    maxUsers: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
    },
    monthlyPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: `In ${CURRENCY}`
    },
    yearlyPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
      comment: `In ${CURRENCY}`
    },
    yearlyDiscount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
      comment: 'Percentage'
    },
    currency: {
      type: DataTypes.STRING(8),
      defaultValue: 'usd',
    },
    stripeProductId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    stripePriceIdMonthly: {
      type: DataTypes.STRING,
      allowNull: false
    },
    stripePriceIdYearly: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    isFreemium: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
  }, {
    timestamps: true,
    sequelize,
    paranoid: true,
    modelName: 'Plans',
    tableName: 'plans'
  });
  return Plans;
};