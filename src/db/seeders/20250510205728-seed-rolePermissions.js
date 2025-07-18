'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('rolePermissions', [
      { roleId: 3, permissionId: 1 },
      { roleId: 3, permissionId: 2 },
      { roleId: 3, permissionId: 3 },
      { roleId: 3, permissionId: 4 },
      { roleId: 3, permissionId: 5 },
      { roleId: 3, permissionId: 6 },
      { roleId: 3, permissionId: 7 },
      { roleId: 6, permissionId: 1 },
      { roleId: 6, permissionId: 2 },
      { roleId: 6, permissionId: 3 },
      { roleId: 6, permissionId: 4 },
      { roleId: 6, permissionId: 5 },
      { roleId: 6, permissionId: 7 },
      { roleId: 8, permissionId: 1 },
      { roleId: 8, permissionId: 4 },
      { roleId: 9, permissionId: 1 },
      { roleId: 9, permissionId: 2 },
      { roleId: 9, permissionId: 3 },
      { roleId: 9, permissionId: 4 },
      { roleId: 9, permissionId: 5 },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('rolePermissions', null, { truncate: true, cascade: true });
  }
};
