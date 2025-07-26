'use strict';

const dayjs = require('dayjs');
const { randomBytes } = require('node:crypto');

const { db } = require('../db');
const { userHelper, mailHelper } = require('../helpers');
const {
	INVITE_VALIDITY,
} = require('../../config');

const {
  EMAIL_EXISTS,
  EMAIL_EXISTS_EXCEPTION,
	INVITE_EXISTS,
	INVITE_EXISTS_EXCEPTION,
	INVITE_SENT_SUCCESS,
	INVITES_FETCH_SUCCESS,
	INVITE_FETCH_SUCCESS,
	INVITE_DELETED_SUCCESS,
	INVITE_DELETED_FAILURE,
	INVITE_INVALID,
	INVITE_INVALID_EXCEPTION,
	INVITE_EXPIRED,
	INVITE_EXPIRED_EXCEPTION,
} = require('../messages');

const { checkIfUserExists } = userHelper;
const { Op } = db.Sequelize;

/**
 * Send invite to the users via email
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const sendInvite = async (req, res, next) => {
  const {
		firstName,
		lastName,
		email,
		role
	} = req.body, userInfo = req.user;
	const ownerId = userInfo.ownerId || userInfo.userId;

  try {
		const emailExists = await checkIfUserExists(email, 'email');
    if (emailExists) { return res.response(EMAIL_EXISTS, {}, 409, EMAIL_EXISTS_EXCEPTION, false); }

		const inviteExists = await checkIfInviteExists(email, ownerId);
    if (inviteExists) { return res.response(INVITE_EXISTS, {}, 409, INVITE_EXISTS_EXCEPTION, false); }

		const token = randomBytes(32).toString('hex');
		const params = btoa(JSON.stringify({
			token,
			email,
		}));
		const mailData = {
			params,
			fullName: (`${firstName} ${lastName ? lastName : ''}`).trim(),
			ownerName: userInfo.fullName,
			email: email,
		};

		const invite = await db.Invites.create({
			firstName,
			lastName,
			email,
			role,
			ownerId,
			sentById: userInfo.userId,
			token,
			expiryDate: dayjs().add(INVITE_VALIDITY, 'days').toDate()
		});
		await mailHelper.sendInviteEmail(mailData);
    return res.response(INVITE_SENT_SUCCESS, {}, 201);
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

/**
 * Check if invite exists
 * 
 * @param {string} email
 * @param {number} ownerId
 * @param {boolean?} returnResult
 * @returns {Object | boolean}
 */
const checkIfInviteExists = async (email, ownerId, returnResult = false) => {
	try {
		const result = await db.Invites.findOne({
			where: {
				email,
				ownerId,
				status: { [Op.in]: ['accepted', 'pending'] },
				expiryDate: { [Op.gte]: dayjs().toDate() }
			}
		});
		if (returnResult) { return result; }
		return result ? true : false;
	} catch (error) {
		throw error;
	}
};

/**
 * Fetch all active invites sent by an organization
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchInvites = async (req, res, next) => {
	try {
		const userInfo = req.user;
		let { page, pageSize } = req.query;
		page = page ? parseInt(page) : 1;
		pageSize = pageSize ? parseInt(pageSize) : 10;
    const pageOffset = pageSize * (page - 1);
		const ownerId = userInfo.ownerId || userInfo.userId;

		const { count, rows } = await db.Invites.findAndCountAll({
			attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'ownerId', 'status', 'expiryDate'],
			where: {
				ownerId
			},
			limit: pageSize,
      offset: pageOffset,
			order: [['createdAt', 'DESC']]
		});
		const invites = rows.map(row => ({
			...row.dataValues,
			status: dayjs(row.expiryDate).isBefore(dayjs()) ? 'expired' : row.status
		}))
    return res.response(INVITES_FETCH_SUCCESS, { count, invites });
	} catch (error) {
		throw error;
	}
};

/**
 * Fetch invite details
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchInviteDetails = async (req, res, next) => {
  try {
    const inviteId = parseInt(req.params.id), userInfo = req.user;
		const ownerId = userInfo.ownerId || userInfo.userId;
    const invite = await db.Invites.findOne({
			attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'ownerId', 'sentById', 'status', 'userId', 'expiryDate'],
			where: { id: inviteId, ownerId },
			include: {
				model: db.Users,
				as: 'sentByUser',
				required: true,
				attributes: ['id', 'fullName', 'firstName', 'lastName'],
			}
		});
		if (invite?.expiryDate) {
			invite.status = invite?.expiryDate && dayjs(invite.expiryDate).isBefore(dayjs()) ? 'expired' : invite?.status;
		}
    return res.response(INVITE_FETCH_SUCCESS, { invite });
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

/**
 * Delete an invite
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const deleteInvite = async (req, res, next) => {
  try {
    const inviteId = parseInt(req.params.id), userInfo = req.user;
    const ownerId = userInfo?.ownerId || userInfo.userId;

    const result = await db.Invites.destroy({
			where: { id: inviteId, ownerId }
		});
    return res.response(result ? INVITE_DELETED_SUCCESS : INVITE_DELETED_FAILURE, result, result ? 200 : 404);
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

/**
 * Verify if an invite is valid and return the details
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const verifyInvite = async (req, res, next) => {
	try {
		const { token, email } = req.body;

    const invite = await db.Invites.findOne({
			attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'ownerId', 'token', 'sentById', 'status', 'expiryDate'],
			where: { token, email, status: ['pending', 'expired'] },
			include: [{
				model: db.Users,
				as: 'sentByUser',
				required: true,
				attributes: ['id', 'fullName', 'firstName', 'lastName'],
			}, {
				model: db.Users,
				as: 'inviteOwner',
				required: true,
				attributes: ['id', 'fullName', 'firstName', 'lastName'],
			}]
		});
    if (!invite) { return res.response(INVITE_INVALID, {}, 410, INVITE_INVALID_EXCEPTION, false); }

		if (dayjs(invite.expiryDate).isBefore(dayjs())) {
			return res.response(INVITE_EXPIRED, {}, 404, INVITE_EXPIRED_EXCEPTION, false);
		}

		invite.status = invite?.expiryDate && dayjs(invite.expiryDate).isBefore(dayjs()) ? 'expired' : invite?.status;

    return res.response(INVITE_FETCH_SUCCESS, { invite });

	} catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
	}
};

/**
 * Resend invite
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const resendInvite = async (req, res, next) => {
	try {
		const inviteId = req?.params?.inviteId ? parseInt(req?.params?.inviteId) : null, userInfo = req.user;
		const ownerId = userInfo?.ownerId || userInfo?.userId;

		const invite = await db.Invites.findOne({
			attributes: ['id', 'firstName', 'lastName', 'email', 'ownerId', 'token', 'sentById', 'status', 'expiryDate'],
			where: {
				id: inviteId,
				ownerId,
				status: {
					[Op.ne]: 'accepted'
				}
			}
		});
    if (!invite) { return res.response(INVITE_INVALID, {}, 400, INVITE_INVALID_EXCEPTION, false); }

		const mailData = {
			params: btoa(JSON.stringify({ token: invite.token, email: invite.email })),
			fullName: (`${invite.firstName} ${invite.lastName ? invite.lastName : ''}`).trim(),
			ownerName: userInfo.fullName,
			email: invite.email,
		};

		const updated = await invite.update({
			status: 'pending',
			expiryDate: dayjs().add(INVITE_VALIDITY, 'days').toDate()
		});
		await mailHelper.sendInviteEmail(mailData);

    return res.response(INVITE_SENT_SUCCESS, updated);
	} catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
	}
};

module.exports = {
  sendInvite,
	fetchInvites,
	fetchInviteDetails,
	deleteInvite,
	verifyInvite,
	resendInvite,
}
