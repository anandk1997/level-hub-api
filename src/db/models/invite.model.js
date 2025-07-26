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
     * 
     * @param {object} models
     */
    static associate(models) {
      Invites.belongsTo(models.Users, { foreignKey: 'ownerId', as: 'inviteOwner' });
      Invites.belongsTo(models.Users, { foreignKey: 'sentById', as: 'sentByUser' });
      Invites.belongsTo(models.Users, { foreignKey: 'userId', as: 'createdUser' });
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
    role: {
      type: DataTypes.STRING(128),
      allowNull: false,
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
    sentById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
				model: 'users',
				key: 'id',
			},
    },
    token: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'expired'),
      defaultValue: 'pending'
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
				model: 'users',
				key: 'id',
			},
    }
  }, {
    timestamps: true,
    sequelize,
    modelName: 'Invites',
    tableName: 'invites',
    hooks: {
      beforeCreate: async (invite) => {
        await Invites.destroy({
					where: {
						email: invite.email,
						ownerId: invite.ownerId,
					}
				});
      }
    }
  });
  return Invites;
};