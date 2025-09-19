'use strict';

const { CURRENCY } = require('../../../config');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('plans', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      roleId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id'
        }
      },
      tier: {
        type: Sequelize.STRING,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      minUsers: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false,
      },
      maxUsers: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false,
      },
      monthlyPrice: {
        type: Sequelize.FLOAT,
        allowNull: false,
        comment: `In ${CURRENCY}`
      },
      yearlyPrice: {
        type: Sequelize.FLOAT,
        allowNull: false,
        comment: `In ${CURRENCY}`
      },
      yearlyDiscount: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
        comment: 'Percentage'
      },
      currency: {
        type: Sequelize.STRING(8),
        defaultValue: 'usd'
      },
      stripeProductId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      stripePriceIdMonthly: {
        type: Sequelize.STRING,
        allowNull: false
      },
      stripePriceIdYearly: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      isFreemium: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('plans');
  }
};
