'use strict';

const {
  PERMISSIONS: {
    ACCOUNT_MANAGE,
    ACTIVITY_MANAGE,
    ACTIVITY_APPROVE,
    ACTIVITY_VIEW,
    USER_INVITE,
    LEVEL_MANAGE,
    SUBACCOUNT_MANAGE,
  }
} = require("../../constants");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('permissions', [
      { key: ACCOUNT_MANAGE, createdAt: new Date(), updatedAt: new Date(), },
      { key: ACTIVITY_MANAGE, createdAt: new Date(), updatedAt: new Date(), },
      { key: ACTIVITY_APPROVE, createdAt: new Date(), updatedAt: new Date(), },
      { key: ACTIVITY_VIEW, createdAt: new Date(), updatedAt: new Date(), },
      { key: LEVEL_MANAGE, createdAt: new Date(), updatedAt: new Date(), },
      { key: USER_INVITE, createdAt: new Date(), updatedAt: new Date(), },
      { key: SUBACCOUNT_MANAGE, createdAt: new Date(), updatedAt: new Date(), },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('permissions', null, {});
  }
};
