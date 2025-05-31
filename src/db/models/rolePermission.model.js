'use strict';

const { Model } = require('sequelize');

/**
 * RolePermission Model Defination
 * 
 * @typedef {import('sequelize').Model} Model
 * @typedef {import('sequelize').Sequelize} Sequelize
 *
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @param {import('sequelize').DataTypes} DataTypes - Sequelize DataTypes
 * @returns {import('sequelize').Model} - RolePermission model
 */
module.exports = (sequelize, DataTypes) => {
  class RolePermissions extends Model {
    static associate(models) {
      RolePermissions.belongsTo(models.Roles, { foreignKey: "roleId", as: 'role' });
      RolePermissions.belongsTo(models.Permissions, { foreignKey: "permissionId", as: 'permission' });
    }
  }
  RolePermissions.init({
    roleId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    permissionId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    }
  }, {
    timestamps: false,
    sequelize,
    modelName: 'RolePermissions',
    tableName: 'rolePermissions'
  });
  return RolePermissions;
};