'user strict';

/** @type {import('joi')} */
const Joi = require('joi').extend(require('@joi/date'));
const { VALIDATION_ERROR_EXCEPTION } = require('../messages');
const {
	USER_ASSOCIATIONS: {
		GYM_COACH,
		ORGANIZATION_USER,
		PARENT_CHILD
	},
	ROLES: {
		PARENT,
		CHILD,
		INDIVIDUAL,
		COACH_HEAD,
		COACH
	}
} = require('../constants');

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

/**
 * Reset child's password schema validation
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const resetChildPasswordValidation = async (req, res, next) => {
	const schema = Joi.object({
		childId: Joi.number().integer().positive().required(),
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
 * Fetch associated users schema validation
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchAssociatedValidation = async (req, res, next) => {
	const schema = Joi.object({
		relation: Joi.string().valid(GYM_COACH, ORGANIZATION_USER, PARENT_CHILD).optional()
	});
	try {
		await schema.validateAsync(req.query);
		next();
	} catch (error) {
		return res.response(error?.message, {}, 400, VALIDATION_ERROR_EXCEPTION, false);
	}
};

/**
 * Fetch Activities schema validation
 *
 * @async
 * @function fetchActivitiesValidation
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchUsersValidation = async (req, res, next) => {
	/** @type {import('joi').ObjectSchema} */
  const schema = Joi.object({
    role: Joi.string().valid(PARENT, CHILD, INDIVIDUAL, "ALL").optional(),
    search: Joi.string().max(255).optional().allow(""),
    sort: Joi.string().valid("ASC", "DESC").optional(),
    sortBy: Joi.string().valid("fullName", "email", 'role').optional(),
    page: Joi.number().integer().strict().min(1).optional(),
    pageSize: Joi.number().integer().strict().min(1).max(100).optional(),
    // assigneeId: Joi.number().integer().positive().optional(),
  });
  try {
    await schema.validateAsync(req.body);
    next();
  } catch (error) {
    return res.response(error?.message, {}, 400, VALIDATION_ERROR_EXCEPTION, false);
  }
};

/**
 * Fetch related users schema validation
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const relatedUsersValidation = async (req, res, next) => {
	/** @type {import('joi').ObjectSchema} */
  const schema = Joi.object({
    type: Joi.string().valid('parent', 'child', 'owner').optional(),
    id: Joi.number().required(),
  });
  try {
    await schema.validateAsync(req.params);
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
const coachAccountValidation = async (req, res, next) => {
	/** @type {import('joi').ObjectSchema} */
	const schema = Joi.object({
		firstName: Joi.string().min(1).max(128).required(),
		lastName: Joi.string().max(128).allow().optional(),
		email: Joi.string().max(128).email({ minDomainSegments: 2 }).required(),
		phone: Joi.string().max(20).optional(),
		password: Joi.string().min(8).max(128).required(),
		role: Joi.string().valid(COACH_HEAD, COACH).required(),
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
 * Update coach account validation
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const updateCoachValidation = async (req, res, next) => {
	/** @type {import('joi').ObjectSchema} */
	const schema = Joi.object({
		coachId: Joi.number().integer().positive().required(),
		firstName: Joi.string().min(1).max(128).required(),
		lastName: Joi.string().max(128).allow('').optional(),
		phone: Joi.string().max(20).optional(),
		role: Joi.string().valid(COACH_HEAD, COACH).required(),
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
 * Fetch invites schema validation
 *
 * @async
 * @function fetchInvitesValidation
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchCoachesValidation = async (req, res, next) => {
	let { page, pageSize } = req.query;
	page = page ? parseInt(page) : page;
	pageSize = pageSize ? parseInt(pageSize) : pageSize;
	const schema = Joi.object({
		page: Joi.number().integer().min(1).optional(),
		pageSize: Joi.number().integer().min(1).max(100).optional(),
		search: Joi.string().min(1).max(100).allow('').optional(),
		role: Joi.string().valid(COACH_HEAD, COACH, "ALL").optional(),
		sort: Joi.string().valid("ASC", "DESC").optional(),
    sortBy: Joi.string().valid("fullName", "email", 'role').optional(),
	});
	try {
		// await schema.validateAsync({ page, pageSize, search });
		await schema.validateAsync(req.query);
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
	resetChildPasswordValidation,
	fetchAssociatedValidation,
	fetchUsersValidation,
	relatedUsersValidation,
	coachAccountValidation,
	updateCoachValidation,
	fetchCoachesValidation,
};