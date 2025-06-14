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
} = require('../messages');
const { checkIfUserExists } = require('../helpers/userHelper');
const {
	ROLES: {
		CHILD
	},
	USER_ASSOCIATIONS: {
		PARENT_CHILD,
	}
} = require('../constants');
const {
	MAX_CHILD_LIMIT
} = require('../../config');

const { sequelize, } = db;
// const { Op, fn, col, where, literal } = db.Sequelize;


/**
 * API to create a new child
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const createChildAccount = async (req, res, next) => {
	try {
		const request = req.body, userId = req.userId;
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
				email: request?.email?.trim(),
				username: request?.username?.trim(),
				password,
				phone: request?.phone?.trim(),
				gender: request?.gender?.trim(),
				dob: request?.dob,
				roleId: role.id,
				isPrimaryAccount: false,
			};
   		const userResult = await db.Users.create(user, { transaction: t });

			await db.UserConfig.create({
				userId: userResult.id,
				isVerified: true,
				registrationSource: 'subaccount'
			}, {
				transaction: t
			});
			await db.UserAssociations.create({
				primaryUserId: userId,
				associatedUserId: userResult.id,
				relationType: PARENT_CHILD
			}, {
				transaction: t
			});
		});
    return res.response(CHILD_CREATE_SUCCESS, {}, 201);
	} catch (error) {
		return next({ error, statusCode: 500, message: error?.message });
	}
};


module.exports = {
	createChildAccount,
};