'user strict';

/** @type {import('joi')} */
const Joi = require('joi').extend(require('@joi/date'));
const { VALIDATION_ERROR_EXCEPTION } = require('../messages');

/**
 * Update user profile schema validation
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const updateProfileValidation = async (req, res, next) => {
	const schema = Joi.object({
		firstName: Joi.string().min(1).max(128).required(),
		lastName: Joi.string().max(128).allow('').optional(),
		phone: Joi.string().max(20).optional(),
		gender: Joi.string().valid('male', 'female', 'others').optional(),
		dob: Joi.date().format('YYYY-MM-DD').raw().optional(),
		organizationName: Joi.string().max(256).optional(),
	});
	try {
		await schema.validateAsync(req.body);
		next();
	} catch (error) {
		return res.response(error?.message, {}, 400, VALIDATION_ERROR_EXCEPTION, false);
	}
};

/**
 * Change password schema validation
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const changePasswordValidation = async (req, res, next) => {
	const schema = Joi.object({
		oldPassword: Joi.string().required(),
		newPassword: Joi.string().min(8).max(128).required().label('New Password'),
		confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
				.label('Confirm Password').options({
					messages: { 'any.only': '{{#label}} does not match' }
				}),
	});
	try {
		await schema.validateAsync(req.body);
		next();
	} catch (error) {
		return res.response(error?.message, {}, 400, VALIDATION_ERROR_EXCEPTION, false);
	}
};

module.exports = {
	updateProfileValidation,
	changePasswordValidation,
};