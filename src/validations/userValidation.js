'user strict';

const Joi = require('joi');
const { ErrorHandler } = require('../helpers/errorhandler');

/**
 * Update user profile schema validation
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const updateProfileValidation = async (req, res, next) => {
	const schema = Joi.object({
		name: Joi.string().min(1).max(255).required(),
		address: Joi.string().max(255).required(),
		city: Joi.string().max(128).required(),
		state: Joi.string().max(128).required(),
		zip: Joi.string().max(32).required(),
		apartmentName: Joi.string().max(255).required(),
		unitNumber: Joi.string().max(255).allow('').optional(),
		rentAmount: Joi.string().required(),
		impactReason: Joi.string().required(),
	});
	try {
		await schema.validateAsync(req.body);
		next();
	} catch (error) {
		console.log("ERROR in  signupValidation : ", error);
		return next(new ErrorHandler(400, error?.message, error ));        
	}
};

/**
 * Update user password schema validation
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const updatePasswordValidation = async (req, res, next) => {
	const schema = Joi.object({
		password: Joi.string().min(8).max(128).required(),
	});
	try {
		await schema.validateAsync(req.body);
		next();
	} catch (error) {
		console.log("ERROR in  signupValidation : ", error);
		return next(new ErrorHandler(400, error?.message, error ));        
	}
};

module.exports = {
	updateProfileValidation,
	updatePasswordValidation,
};