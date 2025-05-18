'user strict';

const Joi = require('joi');
const joiDate = require('@joi/date');
const { DAYS } = require('../constants');
const { VALIDATION_ERROR_EXCEPTION, ACT_END_DATE_MIN_VALIDATION, ACT_END_DATE_MAX_VALIDATION, ACT_START_DATE_MIN_VALIDATION, ACT_START_DATE_MAX_VALIDATION } = require('../messages');
const dayjs = require('dayjs');

const { MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY } = DAYS;
const joiExtended = Joi.extend(joiDate);


/**
 * Fetch Monthly Activity Reports schema validation
 *
 * @async
 * @function monthlyActivityHistValidation
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const monthlyActivityHistValidation = async (req, res, next) => {
  const schema = Joi.object({
    date: joiExtended.date().format('YYYY-MM-DD').raw().optional(),
  });
  try {
    await schema.validateAsync(req.query);
    next();
  } catch (error) {
    return res.response(error?.message, {}, 400, VALIDATION_ERROR_EXCEPTION, false);
  }
};

module.exports = {
	monthlyActivityHistValidation,
};