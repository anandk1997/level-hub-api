'use strict';

const { Model } = require('sequelize');

/**
 * Roles Model Defination
 * 
 * @typedef {import('sequelize').Model} Model
 * @typedef {import('sequelize').Sequelize} Sequelize
 *
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @param {import('sequelize').DataTypes} DataTypes - Sequelize DataTypes
 * @returns {import('sequelize').Model} - Roles model
 */
module.exports = (sequelize, DataTypes) => {
  class Roles extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Roles.hasMany(models.Users, { foreignKey: 'roleId' });
      Roles.belongsToMany(models.Permissions, {
        through: 'rolePermissions',
        as: 'permissions',
        foreignKey: 'roleId',
        otherKey: 'permissionId'
      });
    }
  }
  Roles.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    isSuperAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    timestamps: true,
    sequelize,
    modelName: 'Roles',
    tableName: 'roles'
  });
  return Roles;
};