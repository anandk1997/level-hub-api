'user strict';

/** @type {import('joi')} */
const Joi = require('joi').extend(require('@joi/date'));
// const { ErrorHandler } = require('../helpers');
const { VALIDATION_ERROR_EXCEPTION } = require('../messages');
const { ROLES } = require('../constants');


/**
 * Send invite validation
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const sendInviteValidation = async (req, res, next) => {
	/** @type {import('joi').ObjectSchema} */
	const schema = Joi.object({
		firstName: Joi.string().min(1).max(128).required(),
		lastName: Joi.string().max(128).allow('').optional(),
		email: Joi.string().max(128).email({ minDomainSegments: 2 }).required(),
		role: Joi.string().valid(
			ROLES.COACH_HEAD,
			ROLES.COACH,
			ROLES.PARENT,
			ROLES.INDIVIDUAL,
		),
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
 * @function fetchActivitiesValidation
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchInvitesValidation = async (req, res, next) => {
	let { page, pageSize } = req.query;
	page = page ? parseInt(page) : page;
	pageSize = pageSize ? parseInt(pageSize) : pageSize;
  const schema = Joi.object({
    page: Joi.number().integer().strict().min(1).optional(),
    pageSize: Joi.number().integer().strict().min(1).max(100).optional(),
  });
  try {
    await schema.validateAsync({ page, pageSize });
    next();
  } catch (error) {
    return res.response(error?.message, {}, 400, VALIDATION_ERROR_EXCEPTION, false);
  }
};

/**
 * Verify invite validation
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const verifyInviteValidation = async (req, res, next) => {
	/** @type {import('joi').ObjectSchema} */
	const schema = Joi.object({
		token: Joi.string().min(1).required(),
		email: Joi.string().max(128).email({ minDomainSegments: 2 }).required(),
	});
	try {
		await schema.validateAsync(req.body);
		next();
	} catch (error) {
		return res.response(error?.message, {}, 400, VALIDATION_ERROR_EXCEPTION, false);
	}
};

module.exports = {
	sendInviteValidation,
	fetchInvitesValidation,
	verifyInviteValidation,
};