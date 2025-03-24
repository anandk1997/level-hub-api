'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('roles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        trim: true,
      },
      isSuperAdmin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    await queryInterface.bulkInsert('roles', [
      {
        name: 'admin',
        isSuperAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }, {
        name: 'gym',
        isSuperAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }, {
        name: 'coach',
        isSuperAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }, {
        name: 'parent',
        isSuperAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },{
        name: 'child',
        isSuperAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }, {
        name: 'individual',
        isSuperAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('roles');
  }
};
