'use strict';

const { hashSync, compareSync } = require('bcrypt');
const {
  SALT_ROUNDS,
  EMAIL_VERIFICATION_OTP,
  APP_NAME,
  OTP_VALIDITY,
} = require('../../config');
const Auth = require('../middlewares/auth');
const dayjs = require('dayjs');

const { db } = require('../db');
const { userHelper, Mailer } = require('../helpers');
const { generateOtp } = require('../utils');
const {
  EMAIL_EXISTS,
  EMAIL_EXISTS_EXCEPTION,
  SIGNUP_SUCCESS,
  ROLE_NOT_EXISTS,
  SIGNIN_SUCCESS,
	INVALID_OTP,
	INVALID_OTP_EXCEPTION,
	VERIFY_SUCCESS,
	USER_DOESNT_EXISTS,
	USER_DOESNT_EXISTS_EXCEPTION,
	INCORRECT_PASS,
	INCORRECT_PASS_EXCEPTION,
	ACCOUNT_NOT_VERIFIED,
	ACCOUNT_NOT_VERIFIED_EXCEPTION,
	RESENT_OTP_SUCCESS,
} = require('../messages.js');

const { checkIfUserExists } = userHelper;
const { Op, where, col, fn } = db.Sequelize;

/**
 * Sign Up user
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const sendInvite = async (req, res, next) => {
  const request = req.body, userInfo = req.user;
  try {
		const emailExists = await checkIfUserExists(request.email, 'email');
    if (emailExists) { return res.response(EMAIL_EXISTS, {}, 409, EMAIL_EXISTS_EXCEPTION, false); }

		// const inviteExists = await db.Invites.findOne({  })
		return res.json({ userInfo, emailExists, request });
    // const phoneExists = await checkIfUserExists(request.phone, 'phone');
    // if (phoneExists) { return res.response(PHONE_EXISTS, {}, 409, PHONE_EXISTS_EXCEPTION, false); }
    
    const password = await hashSync(request.password, SALT_ROUNDS);

    const role = await db.Roles.findOne({
      attributes: ['id'],
      where: { name: request.type }
    });
    if (!role) { return res.response(ROLE_NOT_EXISTS, {}, 400); }

    const user = {
      firstName: request.firstName.trim(),
      lastName: request.lastName ? request.lastName.trim() : null,
      email: request.email.trim(),
      phone: request?.phone? request?.phone?.trim() : null,
      gender: request?.gender? request?.gender?.trim() : null,
      password,
      dob: request.dob || null,
      roleId: role.id,
			isPrimaryAccount: request?.source === 'self',
    };

    const result = await db.Users.create(user);
		const { otp } = await saveOTP(result.id, EMAIL_VERIFICATION_OTP);

    await db.UserConfig.create({
			userId: result.id,
			isVerified: false,
			registrationSource: request.source
		});
    await sendRegistrationOTP({ fullName: result.fullName, email: user.email, otp });
    return res.response(SIGNUP_SUCCESS, {}, 201);
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

const saveOTP = async (userId, otpType) => {
  const otp = generateOtp();
  const userOtpCreated = await db.UserOtps.create({ userId, otp, otpType });

  return { otp, userOtpCreated }; // Return plain OTP for sending via email/SMS
};


/**
 * Verify user registration OTP
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const verifyRegistrationOtp = async (req, res, next) => {
	const request = req.body;
	try {

		const user = await db.Users.findOne({
			attributes: ['id', 'email', 'firstName', 'lastName'],
			where: { email: request.email },
			include: [{
				model: db.UserOtps,
				attributes: ['id', 'otp', 'otpType', 'updatedAt'],
				where: {
					otpType: EMAIL_VERIFICATION_OTP,
					updatedAt: { [Op.gte]: dayjs().subtract(OTP_VALIDITY, 'minutes').toDate() } // OTP_VALIDITY
				},
				required: true,
				separate: true, // Fetch associated records in a separate query
				limit: 1, // Limit to 1 record
			}, {
				model: db.UserConfig,
				where: { isVerified: false }
			}],
		});
		if (!user?.UserOtps?.length) { return res.response(INVALID_OTP, {}, 401, INVALID_OTP_EXCEPTION, false); }
		user.dataValues.UserOtps = user?.UserOtps[0];
		const valid = await compareSync(request.otp, user.dataValues.UserOtps.otp);
		
		if (!valid) { return res.response(INVALID_OTP, {}, 401, INVALID_OTP_EXCEPTION, false); }
		
		await db.UserConfig.update({ isVerified: true }, { where: { userId: user.id } });
		await db.UserProgress.create({ userId: user.id, currentXP: 0 });
		await db.UserOtps.destroy({ where: { id: user.dataValues.UserOtps.id } });

		await sendRegistrationMail(user);
		return res.response(VERIFY_SUCCESS);

	} catch (error) {
		return next({ error, statusCode: 500, message: error?.message });
	}
};

/**
 * Resend user registration OTP
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const resendRegistrationOtp = async (req, res, next) => {
	const { email } = req.body;
	try {
		const user = await db.Users.findOne({
			attributes: ['id', 'email', 'firstName', 'lastName'],
			where: { email },
		});

		if (!user?.id) { return res.response(USER_DOESNT_EXISTS, {}, 401, USER_DOESNT_EXISTS_EXCEPTION, false); }
		const { otp } = await saveOTP(user.id, EMAIL_VERIFICATION_OTP);

		await sendRegistrationOTP({ fullName: user.fullName, email: user.email, otp });
		return res.response(RESENT_OTP_SUCCESS);

	} catch (error) {
		return next({ error, statusCode: 500, message: error?.message });
	}
};

/**
 * Validate user credentials
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const signin = async (req, res, next) => {
	const request = req.body;
	request.password = request?.password?.trim();
	request.email = request?.email?.trim().toLowerCase();

	try {
		const user = await db.Users.findOne({
			attributes: [
				'id',
				'firstName',
				'lastName',
				'email',
				'password',
			],		
			where: {
				[Op.or]: [
					where(fn('LOWER', col('email')), request.email),
					where(fn('LOWER', col('username')), request.email),
				]
			},
			include: [{
				model: db.UserConfig,
				attributes: ['isVerified'],
				required: true,
			}, {
				model: db.Roles,
				attributes: ['name'],
				required: true,
				include: {
					model: db.Permissions,
					as: 'permissions',
					required: true,
					attributes: ['id', 'key'],
					through: { attributes: [] },
				}
			}],
		});
		
		if (!user?.id) { return res.response(USER_DOESNT_EXISTS, {}, 401, USER_DOESNT_EXISTS_EXCEPTION, false); }
		
		let valid = await compareSync(request.password, user.password);
		if (!valid) {
			return res.response(INCORRECT_PASS, {}, 401, INCORRECT_PASS_EXCEPTION, false);
		}
		if (!user.UserConfig.isVerified) { return res.response(ACCOUNT_NOT_VERIFIED, {}, 403, ACCOUNT_NOT_VERIFIED_EXCEPTION, false); }

		const userData = {
			id: user.id,
			fullName: `${user.firstName} ${user.lastName}`.trim(),
			email: user.email,
			role: user?.Role?.name,
		};

		const token = await Auth.authorize(userData, '1d');
		userData.permissions = user?.Role?.permissions;
		return res.response(SIGNIN_SUCCESS, { user: userData, token });

	} catch (error) {
		return next({ error, statusCode: 500, message: error?.message });
	}
};



/**
 * Send registration email to user
 * 
 * @param {Object} mailData 
 */
const sendRegistrationMail = async (mailData) => {
	try {
		const mailer = new Mailer();
		const fullname = `${mailData.firstName} ${mailData.lastName}`.trim();

		let mailText = `Hii  ${fullname} \nWelcome to ${APP_NAME}.\nStart you journey as user by setting up your profile and start earning money.`;

		let mailHtml = `Dear ${fullname}<br/>
										Welcome to ${APP_NAME}.<br/>
										Start you exciting journey with ${APP_NAME}.<br/>`;

		const mailDetails = {
			to: mailData.email,
			subject: `Welcome to ${APP_NAME}`, // Subject line
			text: mailText, // plain text body
			html: mailHtml, // html body
			priority: "high",
			useTemplate: true,
			sendBCC: false,
		};
		return await mailer.sendMail(mailDetails);
	} catch (error) {
		console.log("ERROR in sendRegistrationEmail : ", error);
		throw error;
	}
};

/**
 * Send forgot password OTP to user
 * 
 * @param {Object} mailData
 * @param {string} mailData.otp
 * @param {string} mailData.fullName
 * @param {string} mailData.email
 */
const sendForgotPasswordOTP = async (mailData) => {
	try {
		const mailer = new Mailer();

		let mailText = `Your forgot password OTP is ${mailData.otp}, and is valid for ${OTP_VALIDITY} minutes.`;

		let mailHtml = `Dear ${mailData.fullName}<br/>
		Your forgot password OTP is <b>${mailData.otp}</b>, and is valid for ${OTP_VALIDITY} minutes.<br/>`;

		const mailDetails = {
			to: mailData.email,
			subject: `${APP_NAME} | OTP to forgot password : ${mailData.otp}`, // Subject line
			text: mailText, // plain text body
			html: mailHtml, // html body
			priority: "high",
			useTemplate: true,
			sendBCC: false,
		};
		return await mailer.sendMail(mailDetails);
	} catch (error) {
		console.log("ERROR in sendForgotPasswordOTP : ", error);
		throw error;
	}
};

module.exports = {
  sendInvite
}
