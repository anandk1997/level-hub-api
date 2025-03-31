'user strict';

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
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function in the stack.
 * 
 * @throws {Error} Returns a 400 response with a validation error message if validation fails.
 */
const saveActivityValidation = async (req, res, next) => {
  const currentDate = dayjs().startOf('day').toDate();
  const maxStartDate = dayjs().startOf('day').add(1, 'year').toDate();
  const maxEndDate = dayjs(req.body.startDate).startOf('day').add(1, 'year').toDate();

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
      otherwise: Joi.forbidden()
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
    isSelfAssignment: Joi.boolean().required()
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
};