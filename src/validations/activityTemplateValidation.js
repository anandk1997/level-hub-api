'user strict';

const Joi = require('joi');
const joiDate = require('@joi/date');
const { DAYS } = require('../constants');
const { VALIDATION_ERROR_EXCEPTION, ACT_END_DATE_MIN_VALIDATION, ACT_END_DATE_MAX_VALIDATION, ACT_START_DATE_MIN_VALIDATION, ACT_START_DATE_MAX_VALIDATION } = require('../messages');
const dayjs = require('dayjs');

const { MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY } = DAYS;
const joiExtended = Joi.extend(joiDate);

/**
 * Save activity template schema validation
 *
 * @async
 * @function saveActivityTemplateValidation
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * 
 * @throws {Error} Returns a 400 response with a validation error message if validation fails.
 */
const saveTemplateValidation = async (req, res, next) => {
	const schema = Joi.object({
    templateId: Joi.number().integer().optional(),
		title: Joi.string().min(1).max(256).required(),
		description: Joi.string().optional(),
		videoLink: Joi.string().max(256).optional(),
    xp: Joi.number().min(1).max(10000).integer().required().strict(),
	});
	try {
		const a = await schema.validateAsync(req.body);
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
const fetchTemplatesValidation = async (req, res, next) => {
  const schema = Joi.object({
    search: Joi.string().optional().allow(''),
    page: Joi.number().integer().strict().min(1).optional(),
    pageSize: Joi.number().integer().strict().min(1).max(100).optional(),
  });
  try {
    await schema.validateAsync({
      ...req.query,
      page: req?.query?.page ? parseInt(req?.query?.page) : undefined,
      pageSize: req?.query?.pageSize ? parseInt(req?.query?.pageSize) : undefined,
    });
    next();
  } catch (error) {
    return res.response(error?.message, {}, 400, VALIDATION_ERROR_EXCEPTION, false);
  }
};


module.exports = {
	saveTemplateValidation,
  fetchTemplatesValidation,
};