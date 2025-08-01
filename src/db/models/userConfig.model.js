'use strict';

const { Model } = require('sequelize');

/**
 * @typedef {import('sequelize').Model} Model
 * @typedef {import('sequelize').Sequelize} Sequelize
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @param {import('sequelize').DataType} DataTypes
 * @returns {import('sequelize').Model}
 */
module.exports = (sequelize, DataTypes) => {
  class UserConfig extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      UserConfig.belongsTo(models.Users, {
        foreignKey: 'userId',
        onDelete: 'CASCADE' // Delete user config when the user is deleted
      });
    }
  }
  UserConfig.init({
    userId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'users',
				key: 'id'
			},
			onDelete: 'CASCADE'
		},
		isVerified: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
      defaultValue: false
		},
    registrationSource: {
      type: DataTypes.ENUM,
      values: ['self', 'invite', 'subaccount'],
      defaultValue: 'self',
      allowNull: false,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    sequelize,
    modelName: 'UserConfig',
    tableName: 'userConfig',
  });
  return UserConfig;
};