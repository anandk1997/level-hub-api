'use strict';

const {
  PERMISSIONS: {
    ACCOUNT_MANAGE,
    ACTIVITY_MANAGE,
    ACTIVITY_APPROVE,
    ACTIVITY_VIEW,
    USER_INVITE,
    TARGET_MANAGE,
    SUBACCOUNT_MANAGE,
    COACH_MANAGE,
    PLAN_SUBSCRIBE,
    CHILD_MANAGE,
    PLAN_MANAGE
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
      { key: TARGET_MANAGE, createdAt: new Date(), updatedAt: new Date(), },
      { key: USER_INVITE, createdAt: new Date(), updatedAt: new Date(), },
      { key: SUBACCOUNT_MANAGE, createdAt: new Date(), updatedAt: new Date(), },
      { key: COACH_MANAGE, createdAt: new Date(), updatedAt: new Date(), },
      { key: PLAN_SUBSCRIBE, createdAt: new Date(), updatedAt: new Date(), },
      { key: CHILD_MANAGE, createdAt: new Date(), updatedAt: new Date(), },
      { key: PLAN_MANAGE, createdAt: new Date(), updatedAt: new Date(), },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('permissions', null, { truncate: true, cascade: true });
  }
};
