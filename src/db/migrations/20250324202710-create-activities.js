'use strict';

const { DAYS } = require('../../constants');

const { MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY } = DAYS;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('activities', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      videoLink: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      xp: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Experience Points'
      },
      isRecurring: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      assignedDays: {
        type: Sequelize.ARRAY(
          Sequelize.ENUM(MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY)
        ),
        allowNull: true,
      },
      startDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      endDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      assigneeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      assignedById: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      }
    });
    await queryInterface.addIndex('activities', {
      fields: ['assignedDays'],
      using: 'GIN',
      name: 'activities_assignedDays_gin'
    });

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeIndex('activities', 'activities_assignedDays_gin');
    await queryInterface.dropTable('activities');
  }
};
