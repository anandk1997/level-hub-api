'use strict';

const { Model } = require('sequelize');

/**
 * @typedef {import('sequelize').Model} Model
 * @typedef {import('sequelize').Sequelize} Sequelize
 */

module.exports = (sequelize, DataTypes) => {
  class Users extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Users.belongsTo(models.Roles, { foreignKey: 'roleId' });
      Users.hasOne(models.UserConfig, { foreignKey: 'userId' });
      Users.hasMany(models.UserOtps, { foreignKey: 'userId' });
      Users.hasOne(models.Levels, { foreignKey: 'userId' });
    }
  }
  Users.init({
    firstName: {
      type: DataTypes.STRING(128),
      allowNull: false,
      trim: true,
    },
    lastName: {
      type: DataTypes.STRING(128),
      allowNull: false,
      trim: true,
    },
    email: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
      trim: true,
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      trim: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dob: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM,
      values: ['male', 'female', 'others'],
      defaultValue: 'male',
      allowNull: true,
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fullName: {
      type: DataTypes.VIRTUAL,
      get() {
        return `${this.firstName} ${this.lastName}`.trim();
      }
    },
  
  }, {
    timestamps: true,
    sequelize,
    modelName: 'Users',
    tableName: 'users',
  });
  return Users;
};