'user strict';

const { hashSync, compareSync } = require('bcrypt');

const {
	SALT_ROUNDS
} = require('../../config');
const { db } = require('../db');
const {
	USERNAME_EXISTS,
	USERNAME_EXISTS_EXCEPTION,
	ROLE_NOT_EXISTS,
	ROLE_NOT_EXISTS_EXCEPTION,
	CHILD_CREATE_SUCCESS,
  CHILD_MAX_LIMIT_EXCEED,
  CHILD_MAX_LIMIT_EXCEED_EXCEPTION,
	CHILDREN_FETCH_SUCCESS,
	CHILD_UPDATE_SUCCESS,
	UNAUTHORIZED_SUBACCOUNT_ACCESS,
	UNAUTHORIZED_SUBACCOUNT_ACCESS_EXCEPTION,
	PASSWORD_RESET_SUCCESS,
	CHILD_DELETED_SUCCESS,
} = require('../messages');
const { checkIfUserExists, fetchPrimaryUser, checkIfUserAssociated } = require('../helpers/userHelper');
const {
	ROLES: {
		CHILD
	},
	USER_ASSOCIATIONS: {
		PARENT_CHILD,
		ORGANIZATION_USER
	}
} = require('../constants');
const {
	MAX_CHILD_LIMIT
} = require('../../config');

const { sequelize } = db;


/**
 * API to create a new child
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const createChildAccount = async (req, res, next) => {
	try {
		const request = req.body, userId = req.userId, userInfo = req.user;
    const ownerId = userInfo.ownerId || userInfo.userId;
		const usernameExists = await checkIfUserExists(request.username, 'username');
    if (usernameExists) { return res.response(USERNAME_EXISTS, {}, 409, USERNAME_EXISTS_EXCEPTION, false); }

    const childCount = await db.UserAssociations.count({
      where: {
        primaryUserId: userId,
        relationType: PARENT_CHILD
      },
    });
    if (childCount >= MAX_CHILD_LIMIT) {
      return res.response(CHILD_MAX_LIMIT_EXCEED, {}, 400, CHILD_MAX_LIMIT_EXCEED_EXCEPTION, false);
    }

		const role = await db.Roles.findOne({
			attributes: ['id'],
			where: { name: CHILD }
		});
		if (!role?.id) { return res.response(ROLE_NOT_EXISTS, {}, 400, ROLE_NOT_EXISTS_EXCEPTION, false); }

		const result = await sequelize.transaction(async t => {
	    const password = await hashSync(request.password, SALT_ROUNDS);

			const user = {
				firstName: request.firstName.trim(),
				lastName: request.lastName ? request.lastName.trim() : null,
				email: request?.email ? request?.email?.trim() : null,
				username: request?.username?.trim(),
				password,
				phone: request?.phone ? request?.phone?.trim() : null,
				gender: request?.gender ? request?.gender?.trim() : null,
				dob: request?.dob || null,
				roleId: role.id,
				isPrimaryAccount: false,
				ownerId: ownerId,
			};
   		const userResult = await db.Users.create(user, { transaction: t });

			await db.UserConfig.create({
				userId: userResult.id,
				isVerified: true,
				registrationSource: 'subaccount'
			}, {
				transaction: t
			});
			await insertAssociations(userId, userInfo?.ownerId, userResult?.id, t);
			await db.UserProgress.create({ userId: userResult.id, currentXP: 0 }, { transaction: t });

		});
    return res.response(CHILD_CREATE_SUCCESS, {}, 201);
	} catch (error) {
		return next({ error, statusCode: 500, message: error?.message });
	}
};

/**
 * API to fetch all children
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchChildren = async (req, res, next) => {
	try {
		const userId = req.userId, userInfo = req.user;
    const primaryUserId = userInfo.ownerId || userInfo.userId;
    // const primaryUserId = await fetchPrimaryUser(userId, userInfo, PARENT_CHILD);

		const target = await db.Targets.findOne({
      attributes: ['id', 'targetXP'],
      where: { userId: primaryUserId },
    });
		
		const { count, rows } = await db.Users.findAndCountAll({
			attributes: ['id', 'fullName', 'firstName', 'lastName', 'email', 'username', 'phone', 'dob', 'gender', 'profileImage', 'roleId'],
			include: [{
				model: db.UserAssociations,
      	as: 'associatedUser',
				where: {
					primaryUserId: userId,
					relationType: PARENT_CHILD
				},
				subQuery: false,
				required: true
			}, {
				model: db.UserProgress,
				attributes: ['id', 'userId', 'currentXP'],
				subQuery: false
			}],
			order: [['firstName', 'ASC']],
			subQuery: false
		});
		const children = rows.map(child => {
			const childInfo = {
				...child.dataValues,
				targetXP: target?.targetXP,
        currentXP: child?.UserProgress?.currentXP,
	      level: target?.targetXP && child?.UserProgress?.currentXP ? Math.floor(child?.UserProgress?.currentXP / target?.targetXP) : 0
			};
			delete childInfo.associatedUser;
			delete childInfo.UserProgress;
			return childInfo;
		});
    return res.response(CHILDREN_FETCH_SUCCESS, { children, count });
		
	} catch (error) {
		return next({ error, statusCode: 500, message: error?.message });
	}
};

/**
 * API to update child information
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const updateChild = async (req, res, next) => {
	try {
		const request = req.body, userId = req.userId;
		const isAssociated = await checkIfUserAssociated(userId, request?.childId, PARENT_CHILD);
		if (!isAssociated) { return res.response(UNAUTHORIZED_SUBACCOUNT_ACCESS, {}, 401, UNAUTHORIZED_SUBACCOUNT_ACCESS_EXCEPTION, false); }

		const user = {
			firstName: request.firstName.trim(),
			lastName: request.lastName ? request.lastName.trim() : null,
			email: request?.email ? request?.email?.trim() : null,
			phone: request?.phone?.trim(),
			gender: request?.gender?.trim(),
			dob: request?.dob,
		};
		const result = await db.Users.update(
			user,
			{ where: { id: request.childId } }
		);

    return res.response(CHILD_UPDATE_SUCCESS, {}, 200);
	} catch (error) {
		return next({ error, statusCode: 500, message: error?.message });
	}
};

/**
 * API to reset child's password
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const resetChildPassword = async (req, res, next) => {
	try {
		const request = req.body, userId = req.userId;
		const isAssociated = await checkIfUserAssociated(userId, request?.childId, PARENT_CHILD);
		if (!isAssociated) { return res.response(UNAUTHORIZED_SUBACCOUNT_ACCESS, {}, 401, UNAUTHORIZED_SUBACCOUNT_ACCESS_EXCEPTION, false); }

    const passHash = await hashSync(request?.newPassword, SALT_ROUNDS);
		await db.Users.update({ password: passHash }, { where: { id: request?.childId } });
    return res.response(PASSWORD_RESET_SUCCESS);
	} catch (error) {
		return next({ error, statusCode: 500, message: error?.message });
	}
};

/**
 * API to delete child
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const deleteChild = async (req, res, next) => {
	try {
		const childId = parseInt(req.params.id), userId = req.userId;
		const isAssociated = await checkIfUserAssociated(userId, childId, PARENT_CHILD);
		if (!isAssociated) { return res.response(UNAUTHORIZED_SUBACCOUNT_ACCESS, {}, 401, UNAUTHORIZED_SUBACCOUNT_ACCESS_EXCEPTION, false); }

    const result = await db.Users.destroy({ where: { id: childId } });

    return res.response(CHILD_DELETED_SUCCESS, result);
	} catch (error) {
		return next({ error, statusCode: 500, message: error?.message });
	}
};

/**
 * Bulk insert the associations of a child
 *
 * @param {number} parentId
 * @param {number} ownerId
 * @param {number} childId
 * @param {import('sequelize').Transaction} t
 * @returns {Promise<any>}
 */
const insertAssociations = async (parentId, ownerId, childId, t) => {
	try {
		let associations = [{
			primaryUserId: parentId,
			associatedUserId: childId,
			relationType: PARENT_CHILD
		}];
		if (ownerId && ownerId !== parentId) {
			associations = [
				...associations,
				{
					primaryUserId: ownerId,
					associatedUserId: childId,
					relationType: ORGANIZATION_USER
				}
			]
		}
		return await db.UserAssociations.bulkCreate(associations, { transaction: t });
	} catch (error) {
		throw error;
	}
};


module.exports = {
	createChildAccount,
	fetchChildren,
	updateChild,
	resetChildPassword,
	deleteChild,
};