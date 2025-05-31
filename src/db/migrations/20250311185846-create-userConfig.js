'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('userConfig', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      isVerified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      registrationSource: {
        type: Sequelize.ENUM,
        values: ['self', 'invite', 'subaccount'],
        defaultValue: 'self',
        allowNull: false,
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
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('userConfig');
  }
};
