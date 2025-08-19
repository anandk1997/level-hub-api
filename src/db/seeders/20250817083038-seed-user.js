'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('users', [{
      firstName: 'Super',
      lastName: 'Admin',
      email: 'super.admin@levelhub.com',
      username: null,
      phone: null,
      password: "$2b$10$9YqvJQ/b9kLBZWdpTYo8..dHtWer0rUsIhkNuJqx/VFI2rma2ighC",
      dob: null,
      gender: 'male',
      profileImage: null,
      roleId: 1,
      isPrimaryAccount: true,
      ownerId: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }], {});
    await queryInterface.bulkInsert('userConfig', [{
      userId: 1,
      isVerified: true,
      registrationSource: 'self',
      lastLoginAt: null,
      organizationName: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('userConfig', null, {});
  }
};
