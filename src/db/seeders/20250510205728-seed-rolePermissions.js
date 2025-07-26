'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('rolePermissions', [
      { roleId: 2, permissionId: 1 },
      { roleId: 2, permissionId: 2 },
      { roleId: 2, permissionId: 3 },
      { roleId: 2, permissionId: 4 },
      { roleId: 2, permissionId: 5 },
      { roleId: 2, permissionId: 6 },
      { roleId: 2, permissionId: 7 },
      { roleId: 2, permissionId: 8 },
      { roleId: 2, permissionId: 9 },

      { roleId: 3, permissionId: 1 },
      { roleId: 3, permissionId: 2 },
      { roleId: 3, permissionId: 3 },
      { roleId: 3, permissionId: 4 },
      { roleId: 3, permissionId: 5 },
      { roleId: 3, permissionId: 6 },
      { roleId: 3, permissionId: 7 },
      { roleId: 3, permissionId: 9 },

      { roleId: 4, permissionId: 1 },
      { roleId: 4, permissionId: 2 },
      { roleId: 4, permissionId: 3 },
      { roleId: 4, permissionId: 4 },
      { roleId: 4, permissionId: 6 },
      { roleId: 4, permissionId: 7 },

      { roleId: 5, permissionId: 1 },
      { roleId: 5, permissionId: 3 },
      { roleId: 5, permissionId: 4 },

      { roleId: 6, permissionId: 1 },
      { roleId: 6, permissionId: 2 },
      { roleId: 6, permissionId: 3 },
      { roleId: 6, permissionId: 4 },
      { roleId: 6, permissionId: 5 },
      { roleId: 6, permissionId: 7 },
      { roleId: 6, permissionId: 9 },

      { roleId: 7, permissionId: 1 },
      { roleId: 7, permissionId: 4 },
      { roleId: 7, permissionId: 7 },

      { roleId: 8, permissionId: 1 },
      { roleId: 8, permissionId: 4 },

      { roleId: 9, permissionId: 1 },
      { roleId: 9, permissionId: 2 },
      { roleId: 9, permissionId: 3 },
      { roleId: 9, permissionId: 4 },
      { roleId: 9, permissionId: 5 },
      { roleId: 9, permissionId: 9 },

      { roleId: 10, permissionId: 1 },
      { roleId: 10, permissionId: 4 },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('rolePermissions', null, { truncate: true, cascade: true });
  }
};
