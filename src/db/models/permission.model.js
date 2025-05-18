'use strict';

const { Model } = require('sequelize');

/**
 * Permissions Model Defination
 * 
 * @typedef {import('sequelize').Model} Model
 * @typedef {import('sequelize').Sequelize} Sequelize
 *
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @param {import('sequelize').DataTypes} DataTypes - Sequelize DataTypes
 * @returns {import('sequelize').Model} - Permissions model
 */
module.exports = (sequelize, DataTypes) => {
  class Permissions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Permissions.belongsToMany(models.Roles, {
        through: "rolePermissions",
        as: 'roles',
        foreignKey: 'permissionId',
        otherKey: "roleId"
      });
    }
  }
  Permissions.init({
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    }
  }, {
    timestamps: true,
    sequelize,
    modelName: 'Permissions',
    tableName: 'permissions'
  });
  return Permissions;
};