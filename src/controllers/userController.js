'user strict';

const { hashSync, compareSync } = require('bcrypt');

const {
	SALT_ROUNDS
} = require('../../config');
const {
	USER_ASSOCIATIONS: {
		PARENT_CHILD,
	},
	ROLES: {
		PARENT_OWNER,
		PARENT,
		COACH_HEAD,
		COACH
	}
} = require('../constants');
const { db } = require('../db');
const {
	USER_DOESNT_EXISTS,
	USER_DOESNT_EXISTS_EXCEPTION,
	INCORRECT_PASS,
	INCORRECT_PASS_EXCEPTION,
	PASSWORD_UPDATE_SUCCESS,
	FETCH_PROFILE_SUCCESS,
	UPDATE_PROFILE_SUCCESS,
	USERNAME_EXISTS,
	USERNAME_EXISTS_EXCEPTION,
	ROLE_NOT_EXISTS,
	ROLE_NOT_EXISTS_EXCEPTION,
	CHILD_CREATE_SUCCESS,
	USER_ASSOCIATED_SUCCESS,
	USERS_FETCH_SUCCESS,
	USER_FETCH_SUCCESS,
	USER_DEACTIVATED_SUCCESS,
	RELATED_USER_FETCH_SUCCESS,
} = require('../messages');
const { userHelper } = require('../helpers');

const { literal, Op, where } = db.Sequelize;

/**
 * API to fetch user profile
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchUserProfile = async (req, res, next) => {
	try {
		const userId = req.userId;
		const result = await db.Users.findOne({
			attributes: ['id', 'firstName', 'lastName', 'email', 'username', 'phone', 'dob', 'gender', 'profileImage', 'fullName'],
			where: { id: userId },
			include: [{
				model: db.Roles,
				attributes: ['id', 'name']
			}, {
				attributes: ['id', 'organizationName'],
				model: db.UserConfig
			}]
		});
		return res.response(FETCH_PROFILE_SUCCESS, { profile: result });
	} catch (error) {
		return next({ error, statusCode: 500, message: error?.message });
	}
};

/**
 * API to update user profile
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const updateUserProfile = async (req, res, next) => {
	try {
		const userId = req.userId, role = req.role;
		let {
			firstName,
			lastName,
			phone,
			gender,
			dob,
			organizationName
		} = req.body;

		const user = {
      firstName: firstName?.trim(),
      lastName: lastName ? lastName?.trim() : null,
      phone: phone ? phone?.trim() : null,
      gender: gender ? gender?.trim() : null,
      dob: dob,
    };
		if (organizationName?.trim()) {
			await db.UserConfig.update(
				{ organizationName: organizationName ? organizationName?.trim() : null },
				{ where: { userId } }
			);
		}

		await db.Users.update(user, { where: { id: userId } });
		return res.response(UPDATE_PROFILE_SUCCESS);
	} catch (error) {
		return next({ error, statusCode: 500, message: error?.message });
	}
};

/**
 * API to change user password
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const changePassword = async (req, res, next) => {
	try {
		const { oldPassword, newPassword } = req.body, userId = req.userId;
		const user = await db.Users.findOne({
			attributes: [ 'id', 'firstName', 'lastName', 'email', 'password' ],
			where: { id: userId },
		});
		if (!user?.id) { return res.response(USER_DOESNT_EXISTS, {}, 401, USER_DOESNT_EXISTS_EXCEPTION, false); }

		let valid = await compareSync(oldPassword, user.password);
		if (!valid) {
			return res.response(INCORRECT_PASS, {}, 400, INCORRECT_PASS_EXCEPTION, false);
		}
    const passHash = await hashSync(newPassword, SALT_ROUNDS);
		await db.Users.update({ password: passHash }, { where: { id: user.id } });
		return res.response(PASSWORD_UPDATE_SUCCESS);
	} catch (error) {
		return next({ error, statusCode: 500, message: error?.message });
	}
};

/**
 * API to fetch all associated users
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchAssociatedUsers = async (req, res, next) => {
	try {
		const { relation } = req?.query, userInfo = req.user;
		let ownerId = userInfo?.ownerId || userInfo?.userId, currentUser;
		const parentRole = [PARENT_OWNER, PARENT];
		if (parentRole.includes(userInfo.role)) { ownerId = userInfo?.userId }
		if (userInfo.role === PARENT_OWNER) {
			currentUser = {
				id: userInfo.userId,
				email: userInfo.email,
				fullName: userInfo.fullName,
				username: userInfo.username,
				firstName: userInfo.firstName,
				lastName: userInfo.lastName,
			};
		}
		let associatedUsers = await userHelper.fetchUsersAssociated(ownerId, relation);
		if (currentUser?.id) {
			associatedUsers = [
				currentUser,
				...associatedUsers
			];
		}
		return res.response(USER_ASSOCIATED_SUCCESS, { associatedUsers });
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
	search = search.trim().toLowerCase();

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

	const searchColumns = ['email', 'username', 'firstName'];
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
 * API to fetch user listing
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchUsers = async (req, res, next) => {
	try {
		let { page = 1, pageSize = 10, role = "ALL", sortBy = 'fullName', sort = 'ASC', search = '' } = req.body, userInfo = req.user;
		const ownerId = userInfo.ownerId || userInfo.userId;
    const pageOffset = pageSize * (page - 1);

		const { likeSearch, order, roleWhere } = await setUsersFilter(role, sortBy, sort, search);

		const target = await db.Targets.findOne({
      attributes: ['id', 'targetXP'],
      where: { userId: ownerId },
    });

		const { count, rows } = await db.Users.findAndCountAll({
			attributes: ['id', 'fullName', 'firstName', 'lastName', 'email', 'username', 'profileImage'],
			where: {
				ownerId,
				isActive: true,
				...likeSearch
			},
			include: [{
				attributes: ['name'],
				model: db.Roles,
				where: {
					name: {
						[Op.notIn]: [COACH_HEAD, COACH],
					},
					...roleWhere
				},
			}, {
				model: db.UserProgress,
				attributes: ['id', 'userId', 'currentXP'],
				subQuery: false
			}],
			limit: pageSize,
      offset: pageOffset,
      order: [order],
      subQuery: false
		});

		const users = rows.map(user => {
			const userInfo = {
				...user.dataValues,
				targetXP: target?.targetXP,
        currentXP: user?.UserProgress?.currentXP,
	      level: target?.targetXP && user?.UserProgress?.currentXP ? Math.floor(user?.UserProgress?.currentXP / target?.targetXP) : 0
			};
			delete userInfo.UserProgress;
			return userInfo;
		});
		return res.response(USERS_FETCH_SUCCESS, { count, users });
	} catch (error) {
		return next({ error, statusCode: 500, message: error?.message });
	}
};

/**
 * API to fetch user details
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchUserDetails = async (req, res, next) => {
	try {
    const userId = parseInt(req?.params?.id), userInfo = req.user;
		const ownerId = userInfo.ownerId || userInfo.userId;

		const user = await db.Users.findOne({
			attributes: ['id', 'fullName', 'firstName', 'lastName', 'email', 'username', 'profileImage', 'phone', 'gender', 'dob'],
			where: {
				id: userId,
				ownerId,
				isActive: true
			},
			include: {
				attributes: ['name'],
				model: db.Roles,
			},
      subQuery: false
		});

		return res.response(USER_FETCH_SUCCESS, { user });
	} catch (error) {
		return next({ error, statusCode: 500, message: error?.message });
	}
};

/**
 * API to deactivate user and it's associated users if any
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const deactivateUser = async (req, res, next) => {
	try {
    const userId = parseInt(req?.params?.id), userInfo = req.user;
		const ownerId = userInfo.ownerId || userInfo.userId;
		let deactivateIds = [userId];
		const associatedUsers = await db.UserAssociations.findAll({ where: { primaryUserId: userId }  });
		if (associatedUsers?.length) {
			deactivateIds = [
				...deactivateIds,
				...associatedUsers.map(associated => associated.associatedUserId)
			];
		}
		const deactivated = await db.Users.update({ isActive: false }, { where: { id: deactivateIds, ownerId }});
		return res.response(USER_DEACTIVATED_SUCCESS, deactivated.length ? deactivated[0] : 0);
	} catch (error) {
		return next({ error, statusCode: 500, message: error?.message });
	}
};

/**
 * API to fetch related associated users
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchRelatedUsers = async (req, res, next) => {
	try {
		const relation = req.params.type, userId = parseInt(req.params.id), userInfo = req.user;
		const ownerId = userInfo.ownerId || userInfo.userId;
		let associatedUsers;

		switch (relation) {
			case 'child':
				associatedUsers = await userHelper.fetchUsersAssociated(userId, PARENT_CHILD, ownerId);
				break;
			default:
				associatedUsers = await userHelper.fetchParent(userId, PARENT_CHILD);
				break;
		}

		return res.response(RELATED_USER_FETCH_SUCCESS, { associatedUsers });
	} catch (error) {
		return next({ error, statusCode: 500, message: error?.message });
	}
};

/**
 * API to fetch owner information
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchOwnerInfo = async (req, res, next) => {
	try {
		const ownerId = req.user?.ownerId;
		if (!ownerId) { return res.response(USER_FETCH_SUCCESS, {}, 400); }

		const ownerInfo = await db.Users.findOne({
			attributes: ['id', 'firstName', 'lastName', 'fullName', 'email', 'phone'],
			where: { id: ownerId, isActive: true },
			include: [{
				attributes: ['id', 'name'],
				model: db.Roles,
				required: true
			}, {
				attributes: ['id', 'organizationName'],
				model: db.UserConfig
			}],
			subQuery: false
		})

		return res.response(RELATED_USER_FETCH_SUCCESS, { ownerInfo });
	} catch (error) {
		return next({ error, statusCode: 500, message: error?.message });
	}
};

const delete_file = (filepath) => {
	if (fs.existsSync(filepath)) {
		fs.unlinkSync(filepath);
	}
};


/**
 * Update profile image
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const update_profile_image = async (req, res, next) => {
	const uploadDir = 'assets/profile_images/';
	let form = new IncomingForm();
	
	form.uploadDir = uploadDir;		//set upload directory
	form.keepExtensions = true;		//keep file extension
	
	form.parse(req, async (err, fields, files) => {
		if (err) { return next(new ErrorHandler(500, config.common_err_msg, err)); }
		const userId = req.user_id;
		// return res.json({ success: false, message: 'reached!', files, fields });
		let filePath = files.file.path;
		// if (!fields.id) { delete_file(filePath); return next(new ErrorHandler(400, 'Missing dialogue ID!')); }
		let filename = filePath.replace(uploadDir, '');

		try {
			if (fields.old_image_path && fs.existsSync(uploadDir + fields.old_image_path)) {
				delete_file(uploadDir + fields.old_image_path);
			}
			// return res.json({ success: false, message: 'asdasd!', files, fields, ifExist, uploadDir, filePath, dialogue });
			const result = await User.update({ profile_image: filename }, { where: { id: userId } });
			return res.json({ success: true, message: 'Uploaded profile image successfully!', data: { filename } });
		} catch (error) {
			next(new ErrorHandler(200, config.common_err_msg, error));
		}			
	});	
	form.on('error', (err) => {
		return next(new ErrorHandler(500, config.common_err_msg, err));
	});
};


module.exports = {
	fetchUserProfile,
	updateUserProfile,
	changePassword,
	fetchAssociatedUsers,
	fetchUsers,
	fetchUserDetails,
	deactivateUser,
	fetchRelatedUsers,
	fetchOwnerInfo,
};