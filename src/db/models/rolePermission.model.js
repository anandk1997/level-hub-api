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
  class RolePermission extends Model {
    static associate(models) {
      RolePermission.belongsTo(models.Roles, { foreignKey: "roleId", as: 'role' });
      RolePermission.belongsTo(models.Permissions, { foreignKey: "permissionId", as: 'permission' });
    }
  }
  RolePermission.init({
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
    modelName: 'RolePermission',
    tableName: 'rolePermission'
  });
  return RolePermission;
};