'use strict';

const {
  PERMISSIONS: {
    ACCOUNT_MANAGEMENT,
    ACTIVITY_APPROVAL,
    ACTIVITY_MANAGEMENT,
    INVITE_USERS,
    LEVEL_MANAGEMENT
  }
} = require("../../constants");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('permissions', [
      { key: ACCOUNT_MANAGEMENT, createdAt: new Date(), updatedAt: new Date(), },
      { key: ACTIVITY_MANAGEMENT, createdAt: new Date(), updatedAt: new Date(), },
      { key: ACTIVITY_APPROVAL, createdAt: new Date(), updatedAt: new Date(), },
      { key: LEVEL_MANAGEMENT, createdAt: new Date(), updatedAt: new Date(), },
      { key: INVITE_USERS, createdAt: new Date(), updatedAt: new Date(), },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('permissions', null, {});
  }
};
