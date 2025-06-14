'user strict';

const { db } = require('../db');
const { Op } = db.Sequelize;

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
		let where = { [field]: value };
		if (userId) {
			where = { ...where, _id: { $ne: userId } };
		}
		const result = await db.Users.findOne({ where });
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
 * Fetches a user from the database based on email or username.
 *
 * @param {string?} email
 * @param {string?} username
 * @param {Array?} attributes
 */
const fetchPrimaryUser = async (email, username, attributes) => {
	try {
		let where = email ? { email } : { username };
		return await db.Users.findOne({
			attributes,
			where,
			include: {
				model: db.UserConfig,
				where: { isPrimaryAccount: true },
				required: true
			}
		});
	} catch (error) {
		throw error;
	}   
};

module.exports = {
	checkIfUserExists,
	fetchUser,
	fetchPrimaryUser
};