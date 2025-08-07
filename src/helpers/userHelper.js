'user strict';

const { db } = require('../db');
const {
	ROLES: {
		PARENT_OWNER,
		COACH_OWNER,
		GYM_OWNER
	},
	USER_ASSOCIATIONS: {
		PARENT_CHILD,
		ORGANIZATION_USER,
		GYM_COACH
	}
} = require('../constants');

/**
 * Check if user exists by given field
 * 
 * @param {string} value
 * @param {string} field
 * @param {string?} userId
 * @param {boolean?} next
 */
const checkIfUserExists = async (value, field, userId = null, returnResult = false) => {
	try {
		let where = { [field]: value, isActive: true };
		if (userId) {
			where = { ...where, _id: { $ne: userId } };
		}
		const result = await db.Users.findOne({
			where,
			include: {
				model: db.UserConfig,
				attributes: ['isVerified'],
				required: true,
			}
		});
		if (returnResult) { return result; }
		return result ? true : false;
	} catch (error) {
		throw error;
	}   
};

/**
 * Fetches a user from the database based on email or username.
 *
 * @param {string?} email
 * @param {string?} username
 * @param {Array?} attributes
 * @returns {Promise<Object|null>} A promise that resolves to the user object if found, or null if not found.
 * @throws {Error} If there is an error during the database query.
 */
const fetchUser = async (email, username, attributes) => {
	try {
		let where = email ? { email } : { username };
		return await db.Users.findOne({
			attributes,
			where
		});
	} catch (error) {
		throw error;
	}
}

/**
 * Fetches the primary user ID
 *
 * @param {number} userId
 * @param {Object} userInfo
 * @param {string} relationType
 * @returns {number}
 */
const fetchPrimaryUser = async (userId, userInfo, relationType) => {
	try {
		if (userInfo?.isPrimaryAccount) { return userId; }
		const userAssociation = await db.UserAssociations.findOne({
			where: { associatedUserId: userId, relationType },
		});
		return userAssociation?.primaryUserId;
	} catch (error) {
		throw error;
	}   
};

/**
 * Check if primary user is associated to permit the associated access
 *
 * @param {number} primaryUserId 
 * @param {number} associatedUserId 
 * @param {String} relationType 
 * @returns {Boolean}
 */
const checkIfUserAssociated = async (primaryUserId, associatedUserId, relationType) => {
	try {
		const where = {
			primaryUserId,
			associatedUserId
		};
		if (relationType) { where.relationType = relationType }
		const associatiation = await db.UserAssociations.findOne({ where });
		return associatiation?.primaryUserId ?  true : false;
	} catch (error) {
		throw error;
	}
};

/**
 * Returns the relation type based on the provided user role
 *
 * @param {string} role - The role of the user (e.g., PARENT_OWNER, COACH_OWNER, GYM_OWNER)
 * @returns {string} The corresponding relation type (e.g., PARENT_CHILD, ORGANIZATION_USER)
 */
const fetchRelationBasedOnRole = (role) => {
	switch (role) {
		case PARENT_OWNER: return PARENT_CHILD;
		case COACH_OWNER: return ORGANIZATION_USER;
		case GYM_OWNER: return ORGANIZATION_USER;
		default: return PARENT_CHILD;
	}
};


/**
 * Fetches the owner ID or user details for a given user
 *
 * @param {number} userId
 * @param {Object} userInfo
 * @param {boolean?} returnIdOnly
 * @returns {Object | number}
 * @throws {Error} If an error occurs during the database query.
 */
const fetchOwner = async (userId, userInfo, returnIdOnly = true) => {
	try {
		if (userInfo?.isPrimaryAccount) { return userId; }
		const user = await db.Users.findByPk(userId, {
			attributes: ['id', 'ownerId']
		});
		return returnIdOnly ? user?.ownerId : user;
	} catch (error) {
		throw error;
	}
};

/**
 * Fetch all associated users based on goven relationship type
 *
 * @param {number} primaryUserId
 * @param {string?} relationType
 * @param {number?} ownerId
 * @returns {Object}
 */
const fetchUsersAssociated = async (primaryUserId, relationType, ownerId) => {
	try {
		let where = { primaryUserId };
		if (relationType) {
			where = { ...where, relationType };
		}
		let userWhere = { isActive: true };
		if (ownerId) { userWhere = { ...userWhere, ownerId } }
		return await db.Users.findAll({
			attributes: ['id', 'fullName', 'firstName', 'lastName', 'email', 'username'],
			where: userWhere,
			include: [{
				model: db.UserAssociations,
				as: 'associatedUser',
				attributes: [],
				where,
				subQuery: false,
			}],
			order: [['firstName', 'ASC']],
		});
	} catch (error) {
		throw error;
	}
};


/**
 * Fetches user associations based on the primary user ID and optional relation type
 *
 * @param {number} primaryUserId
 * @param {string?} relationType
 * @param {string[]?} attributes
 * @returns {Object}
 */
const fetchAssociations = async (primaryUserId, relationType, attributes = ['associatedUserId']) => {
	try {
		let where = { primaryUserId };
		if (relationType) {
			where = { ...where, relationType };
		}
		return await db.UserAssociations.findAll({
			attributes,
			where
		});
	} catch (error) {
		throw error;
	}
};

/**
 * Fetch target info of given user
 *
 * @param {number} userId
 * @param {string[]?} attributes
 * @returns {Object}
 */
const fetchUserTarget = async (userId, attributes = ['id', 'targetXP']) => {
	return db.Targets.findOne({
		attributes,
		where: { userId },
	});
}

/**
 * Fetches the parent by child ID
 *
 * @param {number} userId
 * @param {string} relationType
 * @returns {number}
 */
const fetchParent = async (userId, relationType) => {
	try {
		const user = await db.Users.findOne({
			attributes: ['id', 'fullName', 'firstName', 'lastName', 'email', 'username', 'isActive', 'ownerId'],
			where: { isActive: true },
			include: {
				model: db.UserAssociations,
				as: 'primaryUser',
				attributes: [],
				where: { associatedUserId: userId, relationType },
			},
			subQuery: false,
		});
		return user;
	} catch (error) {
		throw error;
	}
};

module.exports = {
	checkIfUserExists,
	fetchUser,
	fetchPrimaryUser,
	checkIfUserAssociated,
	fetchRelationBasedOnRole,
	fetchOwner,
	fetchUsersAssociated,
	fetchAssociations,
	fetchUserTarget,
	fetchParent,
};