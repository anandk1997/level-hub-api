'user strict';

const { hashSync, compareSync } = require('bcrypt');

const {
	SALT_ROUNDS
} = require('../../config');
const { db } = require('../db');
const {
	EMAIL_EXISTS,
	EMAIL_EXISTS_EXCEPTION,
	ROLE_NOT_EXISTS,
	ROLE_NOT_EXISTS_EXCEPTION,
  COACH_CREATE_SUCCESS,
  COACH_UPDATE_SUCCESS,
  COACH_FETCH_SUCCESS,
	COACH_DELETED_SUCCESS,
	COACH_MAX_LIMIT_EXCEED,
	COACH_MAX_LIMIT_EXCEED_EXCEPTION,
} = require('../messages');
const { checkIfUserExists } = require('../helpers/userHelper');
const {
	USER_ASSOCIATIONS: {
		PARENT_CHILD,
    GYM_COACH,
	}
} = require('../constants');
const {
	MAX_CHILD_LIMIT
} = require('../../config');

const { Op, where, literal } = db.Sequelize;


/**
 * API to create a new coach
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const createCoachAccount = async (req, res, next) => {
	try {
		const request = req.body, userId = req.userId, userInfo = req.user;
    const ownerId = userInfo.ownerId || userInfo.userId;

    const emailExists = await checkIfUserExists(request.email, 'email');
    if (emailExists) { return res.response(EMAIL_EXISTS, {}, 409, EMAIL_EXISTS_EXCEPTION, false); }


		// TODO: Check if owner have exceeded users limit as per subscribed plan
		const coachCount = await db.UserAssociations.count({
      where: {
        primaryUserId: userId,
        relationType: GYM_COACH
      },
    });
    if (coachCount >= MAX_CHILD_LIMIT) {
      return res.response(COACH_MAX_LIMIT_EXCEED, {}, 400, COACH_MAX_LIMIT_EXCEED_EXCEPTION, false);
    }

		const role = await db.Roles.findOne({
			attributes: ['id'],
			where: { name: request.role }
		});
		if (!role?.id) { return res.response(ROLE_NOT_EXISTS, {}, 400, ROLE_NOT_EXISTS_EXCEPTION, false); }
		// return res.json({ role, request });

		const result = await db.sequelize.transaction(async t => {
	    const password = await hashSync(request.password, SALT_ROUNDS);

			const coach = {
				firstName: request.firstName.trim(),
				lastName: request.lastName ? request.lastName.trim() : null,
				email: request?.email ? request?.email?.trim() : null,
				password,
				phone: request?.phone ? request?.phone?.trim() : null,
				gender: request?.gender ? request?.gender?.trim() : null,
				dob: request?.dob || null,
				roleId: role.id,
				isPrimaryAccount: false,
				ownerId: ownerId,
			};
   		const userResult = await db.Users.create(coach, { transaction: t });

			await db.UserConfig.create({
				userId: userResult.id,
				isVerified: true,
				registrationSource: 'subaccount'
			}, {
				transaction: t
			});
			await insertCoachAssociations(userId, userResult?.id, t);
			// await db.UserProgress.create({ userId: userResult.id, currentXP: 0 }, { transaction: t });
		});
    return res.response(COACH_CREATE_SUCCESS, {}, 201);
	} catch (error) {
		return next({ error, statusCode: 500, message: error?.message });
	}
};

/**
 * Generates filter, sorting, and search criteria for querying user listing
 *
 * @param {string} role
 * @param {string} sortBy
 * @param {string} sort
 * @param {string} search
 * @returns {Promise<{ likeSearch: object, order: Array, roleWhere: object }>}
 */
const setUsersFilter = async (role, sortBy, sort, search) => {
	search = search ? search.trim().toLowerCase() : '';

	let roleWhere = {}, orderBy = [];
	if (role.toLowerCase() !== "all") {
		roleWhere = { ...roleWhere, name: role }
	}
	if (sortBy === 'fullName') {
		orderBy = [literal(`"firstName" || ' ' || COALESCE("lastName", '')`)];
	} else if (sortBy === 'role') {
		orderBy = [db.Roles, 'name']
	} else {
		orderBy = [sortBy];
	}
	const order = [...orderBy, sort];

	const searchColumns = ['email', 'firstName'];
	let likeSearch = {};
	if (search !== '') {
		const likeColumns = searchColumns.map(column => {
			return { [column]: { [Op.iLike]: '%' + search + '%' } };
		});
		const fullNameSearch = where(
			literal(`"firstName" || CASE WHEN "lastName" IS NOT NULL THEN ' ' || "lastName" ELSE '' END`),
			{ [Op.iLike]: '%' + search + '%' }
		);
		likeSearch = { [Op.or]: [...likeColumns, fullNameSearch] };
	}
	return {
		likeSearch,
		order,
		roleWhere
	}
};

/**
 * API to fetch all coaches
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchCoaches = async (req, res, next) => {
	try {
		const userId = req.userId, userInfo = req.user;
    // const ownerId = userInfo.ownerId || userInfo.userId;
		let { page, pageSize, search = '', sortBy = 'fullName', sort = 'ASC', role = "ALL" } = req.query;
    page = page ? parseInt(page) : 1;
		pageSize = pageSize ? parseInt(pageSize) : 10;
    const pageOffset = pageSize * (page - 1);

		const { likeSearch, order, roleWhere } = await setUsersFilter(role, sortBy, sort, search);

		const { count, rows } = await db.Users.findAndCountAll({
			attributes: ['id', 'fullName', 'firstName', 'lastName', 'email', 'username', 'phone', 'dob', 'gender', 'profileImage', 'roleId'],
      where: {
				ownerId: userId,
				isActive: true,
				...likeSearch
			},
			include: [{
				model: db.UserAssociations,
      	as: 'associatedUser',
				attributes: [],
				where: {
					primaryUserId: userId,
					relationType: GYM_COACH
				},
				required: true
			}, {
        model: db.Roles,
				attributes: ['id', 'name'],
        required: true,
				where: roleWhere
      }],
      limit: pageSize,
      offset: pageOffset,
			order: [order],
			subQuery: false
		});
    return res.response(COACH_FETCH_SUCCESS, { coaches: rows, count });
	} catch (error) {
		return next({ error, statusCode: 500, message: error?.message });
	}
};

/**
 * API to update coach information
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const updateCoach = async (req, res, next) => {
	try {
		const request = req.body, userId = req.userId;
    
    const role = await db.Roles.findOne({
			attributes: ['id'],
			where: { name: request.role }
		});
		if (!role?.id) { return res.response(ROLE_NOT_EXISTS, {}, 400, ROLE_NOT_EXISTS_EXCEPTION, false); }

		const coach = {
			firstName: request.firstName.trim(),
			lastName: request.lastName ? request.lastName.trim() : null,
			phone: request?.phone ? request?.phone?.trim() : null,
			gender: request?.gender ? request?.gender?.trim() : null,
			dob: request?.dob ? request?.dob : null,
      roleId: role?.id,
		};
		const result = await db.Users.update(
			coach,
			{ where: { id: request.coachId, ownerId: userId } }
		);

    return res.response(COACH_UPDATE_SUCCESS, {}, 200);
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
const deleteCoach = async (req, res, next) => {
	try {
		const coachId = parseInt(req.params.id), userId = req.userId;

    const result = await db.Users.destroy({ where: { id: coachId, ownerId: userId } });
    return res.response(COACH_DELETED_SUCCESS, result, result ? 200 : 400);
	} catch (error) {
		return next({ error, statusCode: 500, message: error?.message });
	}
};

/**
 * Insert the associations of a gym-owner and coach
 *
 * @param {number} gymOwnerId
 * @param {number} coachId
 * @param {import('sequelize').Transaction} t
 * @returns {Promise<any>}
 */
const insertCoachAssociations = async (gymOwnerId, coachId, t) => {
	try {
		const association = {
			primaryUserId: gymOwnerId,
			associatedUserId: coachId,
			relationType: GYM_COACH
		};
		return await db.UserAssociations.create(association, { transaction: t });
	} catch (error) {
		throw error;
	}
};


module.exports = {
	createCoachAccount,
  updateCoach,
  fetchCoaches,
  deleteCoach,
};