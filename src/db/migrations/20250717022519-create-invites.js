'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('invites', {
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
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      role: {
        type: Sequelize.STRING(128),
        allowNull: false,
      },
      ownerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
          onDelete: 'CASCADE',
        },
      },
      sentById: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      token: {
        type: Sequelize.STRING(64),
        allowNull: false,
        unique: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'expired'),
        defaultValue: 'pending'
      },
      expiryDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('invites');
  }
};
