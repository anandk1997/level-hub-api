'use strict';

const dayjs = require('dayjs');
const { COMMON_ERR_MSG } = require('../../config.js');
const logger = require('./logger.js');

class ErrorHandler extends Error {
	
	/**
	 * 
	 * @param {number} statusCode 
	 * @param {any} error 
	 * @param {string} message 
	 * @param {string} errorCode 
	 */
	constructor (statusCode, message, error, errorCode) {
		super();
		this.statusCode = statusCode || 500;
		this.message = message || COMMON_ERR_MSG;
		this.errorCode = errorCode || undefined;
		this.error = error;
		this.error_message = error?.message ? error.message : undefined;
	};
}

/**
 * Handles errors by sending a JSON response with the error details.
 *
 * @param {Object} err - The error object.
 * @param {number} [err.statusCode=500] - The HTTP status code.
 * @param {string} [err.message=COMMON_ERR_MSG] - The error message.
 * @param {Object} [err.error] - The error details.
 * @param {string} [err.errorCode] - The error code.
 * @param {Object} res - The response object.
 * @returns {Object} The JSON response with error details.
 */
const handleError = (err, res) => {
	let { statusCode, message, error, errorCode, error_message } = err;
	console.log(dayjs().format("YYYY-MM-DD HH:mm:ss"), '::', err);
	logger.error(err);

	statusCode = statusCode || 500;
	message = message || COMMON_ERR_MSG;

	return res.status(statusCode).json({
		success: false,
		message,
		code: errorCode,
		error: process.env.NODE_ENV === "development" ? error : undefined,
		error_message,
		timeStamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
		stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
	});
};

module.exports = {
	ErrorHandler,
	handleError
}