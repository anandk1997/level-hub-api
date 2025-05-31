'use strict';
const { USER_ASSOCIATIONS: { PARENT_CHILD, ORGANIZATION_USER, GYM_COACH } } = require('../../constants')

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('userAssociations', {
      primaryUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      associatedUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      relationType: {
        type: Sequelize.ENUM,
        values: [PARENT_CHILD, ORGANIZATION_USER, GYM_COACH],
        allowNull: false
      },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('userAssociations');
  }
};
