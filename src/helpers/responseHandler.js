'use strict';

/**
 * Common response handler middleware
 * 
 * @param {object} req 
 * @param {object} res 
 * @param {function} next 
 */
const responseHandler = (req, res, next) => {
  /**
   * Create a helper function to send the success response
   * 
   * @param {string} message 
   * @param {*} resultData 
   * @param {number} statusCode 
   * @param {string} code 
   * @param {boolean} success 
   */
  res.response = (message, resultData = {}, statusCode = 200, code, success = true) => {
    return res.status(statusCode).json({
      success,
      message,
      code,
      resultData,
    });
  };
  next();
};

module.exports = responseHandler;