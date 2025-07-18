'use strict';

const { Model } = require('sequelize');

/**
 * @typedef {import('sequelize').Model} Model
 * @typedef {import('sequelize').Sequelize} Sequelize
 * @returns {typeof Model} Invites
 */
module.exports = (sequelize, DataTypes) => {
  class Invites extends Model {
    /**
     * Define associations here
     * @param {object} models
     */
    static associate(models) {
      Invites.belongsTo(models.Roles, { foreignKey: 'roleId' });
      Invites.belongsTo(models.Users, { foreignKey: 'ownerId' });
      Invites.belongsTo(models.Users, { foreignKey: 'sentBy' });
    }
  }
  Invites.init({
    firstName: {
      type: DataTypes.STRING(128),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(128),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(128),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
				model: 'roles',
				key: 'id'
			},
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
				model: 'users',
				key: 'id',
        onDelete: 'CASCADE',
			},
    },
    sentBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
				model: 'users',
				key: 'id',
        onDelete: 'CASCADE',
			},
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  }, {
    timestamps: true,
    sequelize,
    modelName: 'Invites',
    tableName: 'invites',
  });
  return Invites;
};