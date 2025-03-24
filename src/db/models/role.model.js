'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Roles extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Roles.hasMany(models.Users, { foreignKey: 'roleId' });
    }
  }
  Roles.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      trim: true,
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