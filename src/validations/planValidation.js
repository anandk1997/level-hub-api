'user strict';

const Joi = require('joi');
const joiDate = require('@joi/date');

const { VALIDATION_ERROR_EXCEPTION } = require('../messages');
const {
  ROLES: {
    INDIVIDUAL_OWNER,
    PARENT_OWNER,
    COACH_OWNER,
    GYM_OWNER,
  }
} = require('../constants');

/** @type {import('joi')} */
const joiExtended = Joi.extend(joiDate);


/**
 * Fetch plans listing validation
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchPlansValidation = async (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    pageSize: Joi.number().integer().min(1).max(100).optional(),
    role: Joi.string().valid(INDIVIDUAL_OWNER, PARENT_OWNER, COACH_OWNER, GYM_OWNER).optional(),
    sort: Joi.string().valid("ASC", "DESC").optional(),
    sortBy: Joi.string().valid("name", "monthlyPrice", "yearlyPrice", "yearlyDiscount").optional(),
  });
  try {
    await schema.validateAsync(req.query);
    next();
  } catch (error) {
    return res.response(error?.message, {}, 400, VALIDATION_ERROR_EXCEPTION, false);
  }
};

/**
 * Create new plan schema validation
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const createPlanValidation = async (req, res, next) => {
  const schema = Joi.object({
    role: Joi.string().valid(INDIVIDUAL_OWNER, PARENT_OWNER, COACH_OWNER, GYM_OWNER).optional(),
    name: Joi.string().max(255).required(),
    description: Joi.string().optional().allow(''),
    minUsers: Joi.number().integer().strict().min(1).required(),
    maxUsers: Joi.number().integer().strict().min(1).required(),
    monthlyPrice: Joi.number().min(1).precision(2).strict().prefs({ convert: false }).required(),
    yearlyPrice: Joi.number().min(1).precision(2).strict().prefs({ convert: false }).required(),
  });
  try {
    await schema.validateAsync(req.body);
    next();
  } catch (error) {
    return res.response(error?.message, {}, 400, VALIDATION_ERROR_EXCEPTION, false);
  }
};

/**
 * Activate/deactibate plan schema validation
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const tooglePlanValidation = async (req, res, next) => {
  const schema = Joi.object({
    id: Joi.number().integer().positive().required(),
    status: Joi.string().valid('activate', 'deactivate').required(),
  });
  try {
    await schema.validateAsync(req.params);
    next();
  } catch (error) {
    return res.response(error?.message, {}, 400, VALIDATION_ERROR_EXCEPTION, false);
  }
};

module.exports = {
  fetchPlansValidation,
  createPlanValidation,
  tooglePlanValidation,
};