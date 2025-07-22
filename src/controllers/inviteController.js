'use strict';

const { hashSync, compareSync } = require('bcrypt');

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
} = require('../messages');

const { checkIfUserExists } = userHelper;
const { Op, where, col, fn } = db.Sequelize;

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
			role,
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
			sentBy: userInfo.userId,
			token,
			expiryDate: dayjs().add(INVITE_VALIDITY, 'days').toDate()
		});
		await mailHelper.sendInviteEmail(mailData);
    return res.response(INVITE_SENT_SUCCESS, {}, 200);
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
			attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'ownerId', 'sentBy', 'status', 'expiryDate'],
			where: { id: inviteId, ownerId },
			include: {
				model: db.Users,
				as: 'sentByUser',
				required: true,
				attributes: ['id', 'fullName', 'firstName', 'lastName'],
			}
		});
		invite.status = dayjs(invite.expiryDate).isBefore(dayjs()) ? 'expired' : invite.status;
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

module.exports = {
  sendInvite,
	fetchInvites,
	fetchInviteDetails,
	deleteInvite,
}
