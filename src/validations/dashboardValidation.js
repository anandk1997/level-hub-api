'user strict';

const Joi = require('joi');
const joiDate = require('@joi/date');

const { VALIDATION_ERROR_EXCEPTION } = require('../messages');
const {
  ROLES: {
    PARENT,
    INDIVIDUAL,
    CHILD
  }
} = require('../constants');

/** @type {import('joi')} */
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
    userId: Joi.number().integer().positive().optional(),
  });
  try {
    await schema.validateAsync(req.query);
    next();
  } catch (error) {
    return res.response(error?.message, {}, 400, VALIDATION_ERROR_EXCEPTION, false);
  }
};

/**
 * Fetch leaderboard schema validation
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchLeaderboardValidation = async (req, res, next) => {
  const schema = Joi.object({
    role: joiExtended.string().valid(PARENT, INDIVIDUAL, CHILD).optional(),
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
  fetchLeaderboardValidation,
};