'user strict';

/** @type {import('joi')} */
const Joi = require('joi').extend(require('@joi/date'));
// const { ErrorHandler } = require('../helpers');
const { VALIDATION_ERROR_EXCEPTION } = require('../messages');
const { ROLES } = require('../constants');


/**
 * Sign Up user schema validation
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const signupValidation = async (req, res, next) => {
	/** @type {import('joi').ObjectSchema} */
	const schema = Joi.object({
		firstName: Joi.string().min(1).max(128).required(),
		lastName: Joi.string().max(128).allow('').optional(),
		email: Joi.string().max(128).email({ minDomainSegments: 2 }).required(),
		phone: Joi.string().max(20).optional(),
		password: Joi.string().min(8).max(128).required(),
		gender: Joi.string().valid('male', 'female', 'others').optional(),
		dob: Joi.date().format('YYYY-MM-DD').raw().optional(),
		source: Joi.string().valid('self', 'invite').required(),
		type: Joi.when('source', {
			is: 'self',
			then: Joi.string().valid(
				ROLES.GYM_OWNER,
				ROLES.COACH_OWNER,
				ROLES.PARENT_OWNER,
				ROLES.INDIVIDUAL_OWNER,
			).required(),
			otherwise: Joi.string().valid(
				ROLES.COACH_HEAD,
				ROLES.COACH,
				ROLES.PARENT,
				ROLES.CHILD,
				ROLES.INDIVIDUAL,
			).required(),
		}),
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
 * Middleware to validate the OTP verification request.
 *
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next middleware function
 */
const verifyOtpValidation = async (req, res, next) => {
	const schema = Joi.object({
		email: Joi.alternatives().try(
			Joi.string().email({ minDomainSegments: 2 }),
			// Joi.string().pattern(/^[0-9]+$/),
		).required(),
		otp: Joi.string().length(6).required(),
	});
	try {
		await schema.validateAsync(req.body);
		next();
	} catch (error) {
		return res.response(error?.message, {}, 400, VALIDATION_ERROR_EXCEPTION, false);
	}
};

/**
 * Middleware to vresent registration verification OTP
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const resendOtp = async (req, res, next) => {
	const schema = Joi.object({
		email: Joi.alternatives().try(
			Joi.string().email({ minDomainSegments: 2 }),
			// Joi.string().pattern(/^[0-9]+$/),
		).required()
	});
	try {
		await schema.validateAsync(req.body);
		next();
	} catch (error) {
		return res.response(error?.message, {}, 400, VALIDATION_ERROR_EXCEPTION, false);
	}
};

/**
 * Sign In user schema validation
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const signinValidation = async (req, res, next) => {
	const schema = Joi.object({
		email: Joi.alternatives().try(
			Joi.string().email({ minDomainSegments: 2 }).message('Invalid email format'),
			Joi.string()
				.pattern(/^(?=.{3,100}$)(?!.*[_.-]{2})[a-zA-Z0-9](?:[a-zA-Z0-9_.-]*[a-zA-Z0-9])?$/)
		).required().messages({
			'alternatives.match': 'Signin must be via a valid email or username',
			'any.required': 'Email/username is required',
		}),
		// email: Joi.string().email({ minDomainSegments: 2 }).required(),
		password: Joi.string().min(8).max(128).required(),
	});
	try {
		await schema.validateAsync(req.body);
		next();
	} catch (error) {
		return res.response(error?.message, {}, 400, VALIDATION_ERROR_EXCEPTION, false);
	}
};

/**
 * Reset password schema validation
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const resetPasswordValidation = async (req, res, next) => {
	const schema = Joi.object({
		email: Joi.string().email({ minDomainSegments: 2 }).required(),
		password: Joi.string().min(8).max(128).required().label('Password'),
		/* confirmPassword: Joi.string().valid(Joi.ref('password')).required()
					.label('Confirm Password').options({
						messages: { 'any.only': '{{#label}} does not match' }
					}), */
		otp: Joi.string().required(),
	});
	try {
		await schema.validateAsync(req.body);
		next();
	} catch (error) {
		return res.response(error?.message, {}, 400, VALIDATION_ERROR_EXCEPTION, false);
	}
};


module.exports = {
	signupValidation,
  signinValidation,
	verifyOtpValidation,
	resendOtp,
	resetPasswordValidation,
};