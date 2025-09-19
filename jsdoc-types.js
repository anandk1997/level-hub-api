/**
 * @fileoverview Main JSDoc type definitions for the API project
 * Include this file in your JSDoc configuration to get global type definitions
 * 
 * @author API Team
 * @version 1.0.0
 */

/**
 * @namespace API
 */

/**
 * Extended Express Response object with custom response method
 * @typedef {import('express').Response & ResponseExtensions} API.ExtendedResponse
 */

/**
 * Custom extensions to Express Response
 * @typedef {Object} ResponseExtensions
 * @property {API.ResponseFunction} response - Standardized response function
 */

/**
 * Standardized response function for consistent API responses
 * @callback API.ResponseFunction
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

/**
 * Standard Express controller function with extended response
 * @callback API.ControllerFunction
 * @param {import('express').Request} req - Express request object
 * @param {API.ExtendedResponse} res - Extended Express response object
 * @param {import('express').NextFunction} next - Express next function
 * @returns {Promise<void>|void}
 */
