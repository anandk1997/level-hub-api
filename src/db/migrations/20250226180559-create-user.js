'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      firstName: {
        type: Sequelize.STRING(128),
        allowNull: false,
      },
      lastName: {
        type: Sequelize.STRING(128),
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING(128),
        allowNull: true,
        unique: false
      },
      username: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: false
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      dob: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      gender: {
        type: Sequelize.ENUM,
        values: ['male', 'female', 'others'],
        allowNull: true,
      },
      profileImage: {
        type: Sequelize.STRING,
        allowNull: true
      },
      roleId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id'
        }
      },
      isPrimaryAccount: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      ownerId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
          // onDelete: 'CASCADE',
          onDelete: 'SET NULL'
        }
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },  
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};
