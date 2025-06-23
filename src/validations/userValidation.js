'user strict';

/** @type {import('joi')} */
const Joi = require('joi').extend(require('@joi/date'));
const { VALIDATION_ERROR_EXCEPTION } = require('../messages');

/**
 * Update user profile schema validation
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
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

/**
 * Create child account validation
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const childAccountValidation = async (req, res, next) => {
	/** @type {import('joi').ObjectSchema} */
	const schema = Joi.object({
		firstName: Joi.string().min(1).max(128).required(),
		lastName: Joi.string().max(128).allow('').optional(),
		email: Joi.string().max(128).email({ minDomainSegments: 2 }).optional(),
		// username: Joi.string().alphanum().min(3).max(255).required(),
		username: Joi.string()
			.pattern(/^(?=.{3,100}$)(?!.*[_.-]{2})[a-zA-Z0-9](?:[a-zA-Z0-9_.-]*[a-zA-Z0-9])?$/)
			.required()
			.label("Username")
			.messages({
			'string.pattern.base': 'Username must be 3-100 characters, alphanumeric, and can contain dots, underscores, or hyphens (not at start/end or consecutively).'
		}),
		phone: Joi.string().max(20).optional(),
		password: Joi.string().min(8).max(128).required(),
		gender: Joi.string().valid('male', 'female', 'others').optional(),
		dob: Joi.date().format('YYYY-MM-DD').raw().optional(),
	});
	try {
		await schema.validateAsync(req.body);
		next();
	} catch (error) {
		return res.response(error?.message, {}, 400, VALIDATION_ERROR_EXCEPTION, false);
	}
};

/**
 * Update child account validation
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const updateChildValidation = async (req, res, next) => {
	/** @type {import('joi').ObjectSchema} */
	const schema = Joi.object({
		childId: Joi.number().integer().positive().required(),
		firstName: Joi.string().min(1).max(128).required(),
		lastName: Joi.string().max(128).allow('').optional(),
		phone: Joi.string().max(20).optional(),
		gender: Joi.string().valid('male', 'female', 'others').optional(),
		dob: Joi.date().format('YYYY-MM-DD').raw().optional(),
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
	childAccountValidation,
	updateChildValidation,
};