'use strict';

const Joi = require('joi');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');

dayjs.extend(customParseFormat);

const JoiObjectId = (message = 'valid id') => Joi.string().regex(/^[0-9a-fA-F]{24}$/, message);

/**
 * Joi 24 hour / military time validation
 * 
 * @param {String} value 
 * @param {Object} helper 
 * @returns {(Boolean | String)}
 */
const JoiMilitaryTimeValidation = (value, helper) => {
  const isValid = dayjs(value, "HH:mm", true).isValid();

  if (!isValid) {
    return helper.message("Invalid time format. Time must be in 24 hours format i.e. HH:mm");
  }
  return true;
};

/**
 * Joi year validation
 * 
 * @param {String} value 
 * @param {Object} helper 
 * @returns {(Boolean | String)}
 */
const JoiYearValidation = (value, helper) => {
  const isValid = dayjs(value, "YYYY", true).isValid();

  if (!isValid) {
    return helper.message("Invalid year format. Time must be in YYYY");
  }
  return true;
};

module.exports = {
  JoiObjectId,
  JoiMilitaryTimeValidation,
  JoiYearValidation,
};