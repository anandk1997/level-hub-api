'use strict';

/**
 * Common response handler middleware that extends Express response object
 * with a custom response method for consistent API responses
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {Function} next
 */
const responseHandler = (req, res, next) => {
  /**
   * Sends a standardized JSON response
   * 
   * @param {string} message - Response message describing the result
   * @param {any} [resultData={}] - Data to be returned in the response
   * @param {number} [statusCode=200] - HTTP status code (default: 200)
   * @param {string} [code] - Optional custom code for the response
   * @param {boolean} [success=true] - Indicates if the operation was successful
   * @returns {import('express').Response} The Express response object for chaining
   *
   * @example
   * // Success response
   * res.response('User created successfully', { userId: 123 }, 201);
   *
   * @example
   * // Error response
   * res.response('User not found', {}, 404, 'USER_NOT_FOUND', false);
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