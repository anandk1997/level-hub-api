'user strict';

/** @type {import('joi')} */
const Joi = require('joi');
const joiDate = require('@joi/date');

const { VALIDATION_ERROR_EXCEPTION } = require('../messages');

const joiExtended = Joi.extend(joiDate);


/**
 * Fetch Activities Reports schema validation
 *
 * @async
 * @function generateReportValidation
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const generateReportValidation = async (req, res, next) => {
  const schema = Joi.object({
    date: joiExtended.date().format('YYYY-MM-DD').raw().optional(),
    userId: Joi.number().integer().positive().optional(),
  });
  try {
    await schema.validateAsync(req.query);
    next();
  } catch (error) {
    return res.response(error?.message, {}, 400, VALIDATION_ERROR_EXCEPTION, false);
  }
};

module.exports = {
	generateReportValidation,
};