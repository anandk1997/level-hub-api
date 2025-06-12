'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('rolePermissions', [
      { roleId: 7, permissionId: 1 },
      { roleId: 7, permissionId: 2 },
      { roleId: 7, permissionId: 3 },
      { roleId: 7, permissionId: 4 },
      { roleId: 7, permissionId: 5 },
      { roleId: 7, permissionId: 7 },
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
