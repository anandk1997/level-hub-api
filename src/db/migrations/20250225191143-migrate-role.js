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
        unique: true,
      },
      isSuperAdmin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      }
    });
    await queryInterface.bulkInsert('roles', [
      {
        name: 'ADMIN',
        isSuperAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }, {
        name: 'GYM.OWNER',
        isSuperAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }, {
        name: 'COACH.OWNER',
        isSuperAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }, {
        name: 'COACH.HEAD',
        isSuperAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }, {
        name: 'COACH',
        isSuperAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }, {
        name: 'PARENT.OWNER',
        isSuperAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }, {
        name: 'PARENT',
        isSuperAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },{
        name: 'CHILD',
        isSuperAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }, {
        name: 'INDIVIDUAL.OWNER',
        isSuperAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }, {
        name: 'INDIVIDUAL',
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
