'user strict';

/** @type {import('joi')} */
const Joi = require('joi');
const joiDate = require('@joi/date');
const { DAYS } = require('../constants');
const { VALIDATION_ERROR_EXCEPTION, ACT_END_DATE_MIN_VALIDATION, ACT_END_DATE_MAX_VALIDATION, ACT_START_DATE_MIN_VALIDATION, ACT_START_DATE_MAX_VALIDATION } = require('../messages');
const dayjs = require('dayjs');

const { MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY } = DAYS;
const joiExtended = Joi.extend(joiDate);

/**
 * Save activity schema validation
 *
 * @async
 * @function saveActivityValidation
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * 
 * @throws {Error} Returns a 400 response with a validation error message if validation fails.
 */
const saveActivityValidation = async (req, res, next) => {
  const currentDate = dayjs().startOf('day').toDate();
  const maxStartDate = dayjs().startOf('day').add(1, 'year').toDate();
  const maxEndDate = dayjs(req?.body?.startDate).startOf('day').add(1, 'year').toDate();

	/** @type {import('joi').ObjectSchema} */
	const schema = Joi.object({
    activityId: Joi.number().integer().optional(),
		title: Joi.string().min(1).max(256).required(),
		description: Joi.string().optional(),
		videoLink: Joi.string().max(256).optional(),
    xp: Joi.number().min(1).max(10000).integer().required().strict(),
		isRecurring: Joi.boolean().required(),
		assignedDays: Joi.array().items(
      Joi.string().valid(MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY)
    ).unique().when('isRecurring', {
      is: true,
      then: Joi.array().min(1).required(),
      otherwise: Joi.forbidden(),
    }),
    startDate: joiExtended.date().format('YYYY-MM-DD').raw().required().min(currentDate).max(maxStartDate).messages({
      'date.min': ACT_START_DATE_MIN_VALIDATION,
      'date.max': ACT_START_DATE_MAX_VALIDATION
    }),
    endDate: joiExtended.date().format('YYYY-MM-DD').raw().min(Joi.ref('startDate')).max(maxEndDate).when('isRecurring', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
    }).messages({
      'date.min': ACT_END_DATE_MIN_VALIDATION,
      'date.max': ACT_END_DATE_MAX_VALIDATION
    }),
    isSelfAssignment: Joi.boolean().required(),
    assigneeId: Joi.when('isSelfAssignment', {
      is: false,
      then: Joi.number().integer().positive().required(),
      otherwise: Joi.number().integer().positive().optional(),
    })
	});
	try {
		await schema.validateAsync(req.body);
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
const fetchActivitiesValidation = async (req, res, next) => {
  const schema = Joi.object({
    startDate: joiExtended.date().format('YYYY-MM-DD').raw().optional(),
    endDate: joiExtended.date().format('YYYY-MM-DD').raw().optional().min(Joi.ref('startDate')),
    status: Joi.string().valid('completed', 'notCompleted', 'all').optional(),
    assigneeId: Joi.string().optional(),
    page: Joi.number().integer().strict().min(1).optional(),
    pageSize: Joi.number().integer().strict().min(1).max(100).optional(),
  });
  try {
    await schema.validateAsync(req.body);
    next();
  } catch (error) {
    return res.response(error?.message, {}, 400, VALIDATION_ERROR_EXCEPTION, false);
  }
};

/**
 * Approve activity schema validation
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const approveActivityValidation = async (req, res, next) => {
  const schema = Joi.object({
    activityIds: Joi.array().items(Joi.number().integer()).min(1).required(),
    remarks: Joi.string().max(255).optional(),
  });
  try {
    await schema.validateAsync(req.body);
    next();
  } catch (error) {
    return res.response(error?.message, {}, 400, VALIDATION_ERROR_EXCEPTION, false);
  }
};


module.exports = {
	saveActivityValidation,
  fetchActivitiesValidation,
  approveActivityValidation,
};