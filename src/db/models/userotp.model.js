'use strict';

const { Model } = require('sequelize');
const { hash } = require('bcrypt');

const { EMAIL_VERIFICATION_OTP, PASS_RESET_OTP, SALT_ROUNDS } = require('../../../config.js');

module.exports = (sequelize, DataTypes) => {
	class UserOtps extends Model {
		/**
		 * Helper method for defining associations.
		 * This method is not a part of Sequelize lifecycle.
		 * The `models/index` file will call this method automatically.
		 */
		static associate(models) {
			UserOtps.belongsTo(models.Users, { 
        foreignKey: 'userId',
        onDelete: 'CASCADE' // Delete OTPs when the user is deleted
      });
		}
	}
	UserOtps.init({
		userId: {
			type: DataTypes.INTEGER,
			allowNull: false,
			references: {
				model: 'users', // Table name
				key: 'id'
			},
			onDelete: 'CASCADE'
		},
		otp: {
			type: DataTypes.STRING, // Store OTP as a string (to preserve leading zeros)
			allowNull: false,
		},
		otpType: {
      type: DataTypes.ENUM(EMAIL_VERIFICATION_OTP, PASS_RESET_OTP),
      allowNull: false
    },

	}, {
		timestamps: true,
		sequelize,
		modelName: 'UserOtps',
		tableName: 'userOtps',
		hooks: {
			beforeCreate: async (userOtp) => {
				await UserOtps.destroy({
					where: {
						userId: userOtp.userId,
						otpType: userOtp.otpType
					}
				});
				userOtp.otp = await hash(userOtp.otp, SALT_ROUNDS); // Hash OTP before saving
			}
		}
	});
	return UserOtps;
};