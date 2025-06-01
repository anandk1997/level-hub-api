'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('rolePermissions', [
      { roleId: 9, permissionId: 1 },
      { roleId: 9, permissionId: 2 },
      { roleId: 9, permissionId: 3 },
      { roleId: 9, permissionId: 4 },
      { roleId: 9, permissionId: 5 },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('rolePermissions', null, {});
  }
};
