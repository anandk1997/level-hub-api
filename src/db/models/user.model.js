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
      Users.hasOne(models.Targets, { foreignKey: 'userId' });
      Users.hasOne(models.UserProgress, { foreignKey: 'userId' });
      Users.hasMany(models.Activities, { foreignKey: 'assigneeId', as: "assignee" });
      Users.hasMany(models.Activities, { foreignKey: 'assignedById', as: "assignedBy" });
      Users.hasMany(models.ActivityTemplates, { foreignKey: 'userId'});
      Users.hasMany(models.UserAssociations, { foreignKey: 'primaryUserId', as: 'primaryUser' });
      Users.hasMany(models.UserAssociations, { foreignKey: 'associatedUserId', as: 'associatedUser' });
      Users.belongsTo(models.Users, { foreignKey: 'ownerId', as: 'owner' });
      Users.hasMany(models.Users, { foreignKey: 'ownerId', as: 'subUsers' });
      Users.hasMany(models.Invites, { foreignKey: 'ownerId', as: 'inviteOwner' });
      Users.hasMany(models.Invites, { foreignKey: 'sentById', as: 'sentByUser' });
      Users.hasMany(models.Invites, { foreignKey: 'userId', as: 'cretaedUser' });
    }
  }
  Users.init({
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
      unique: false,
      validate: {
        isEmail: true,
      },
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
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
      allowNull: true,
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
				model: 'roles',
				key: 'id'
			},
    },
		isPrimaryAccount: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
      defaultValue: false
		},
		ownerId: {
			type: DataTypes.INTEGER,
			allowNull: true,
      references: {
        model: 'users',
        key: 'id',
        // onDelete: 'CASCADE',
        onDelete: 'SET NULL'
      }
		},
    fullName: {
      type: DataTypes.VIRTUAL,
      get() {
        return `${this.firstName} ${this.lastName ? this.lastName : ''}`.trim();
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