'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('permissions', [
      { key: 'ACCOUNT_MANAGEMENT', createdAt: new Date(), updatedAt: new Date(), },
      { key: 'ACTIVITY_MANAGEMENT', createdAt: new Date(), updatedAt: new Date(), },
      { key: 'ACTIVITY_APPROVAL', createdAt: new Date(), updatedAt: new Date(), },
      { key: 'INVITE_USERS', createdAt: new Date(), updatedAt: new Date(), },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('permissions', null, {});
  }
};
