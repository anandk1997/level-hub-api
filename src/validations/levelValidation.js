'user strict';

const Joi = require('joi');
const { VALIDATION_ERROR_EXCEPTION } = require('../messages');


/**
 * Save Level/target XP schema validation
 * 
 * @param {Object} req - The request object.
 * @param {Object} req.body - The body of the request.
 * @param {number} req.body.levelXP - The level XP to be validated.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves to void.
 * @throws {Error} - Throws an error if validation fails.
 */
const targetXPValidation = async (req, res, next) => {
	const schema = Joi.object({
		targetXP: Joi.number().min(1).max(10000).integer().required().strict(),
	});
	try {
		await schema.validateAsync(req.body);
		next();
	} catch (error) {
		return res.response(error?.message, {}, 400, VALIDATION_ERROR_EXCEPTION, false);
	}
};

module.exports = {
	targetXPValidation
};