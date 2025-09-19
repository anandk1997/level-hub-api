'use strict';

const { verify, sign } = require('jsonwebtoken');
const { SECRET, ADMIN_SECRET } = require('../../config');
const {
	INVALID_TOKEN,
	INVALID_TOKEN_EXCEPTION,
	ACCESS_DENIED
} = require('../messages');

/**
 * Check if request have a valid access token
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const checkToken = (req, res, next) => {
	req.header_sub_domain = (req.headers['x-sub-domain'] !== undefined) ? req.headers['x-sub-domain'] : '';
	
	const splitUrl = req.originalUrl.split('/');
	const secret = splitUrl.includes('admin') ? ADMIN_SECRET : SECRET;

	if (req.method === 'OPTIONS') {
		next();
	} else {
		let token = req.headers['x-access-token'] || req.headers['authorization']; // Express headers are auto converted to lowercase
		if (token) {
			if (token.startsWith('Bearer ')) {
				token = token.slice(7, token.length); // Remove Bearer from string
			}
			verify(token, secret, (err, decoded) => {
				if (err) {
					return res.response(INVALID_TOKEN, {}, 401, INVALID_TOKEN_EXCEPTION, false);
				} else {
					req.accessToken = token;
					req.userId = parseInt(decoded.id);
					req.user = {
						userId: parseInt(decoded.id),
						email: decoded.email,
						username: decoded.username,
						role: decoded.role,
					};
					next();
				}
			});
		} else {
			return res.response(ACCESS_DENIED, {}, 401, INVALID_TOKEN_EXCEPTION, false);
		}
	}
};

/**
 * Generates an authorization token for the given user data.
 *
 * @async
 * @param {Object} userData
 * @param {string?} tokenTime
 * @param {Boolean?} isSuperAdmin
 */
const authorize = async(userData, tokenTime, isSuperAdmin) => {
	tokenTime = tokenTime || '6h';
	const secret = isSuperAdmin ? ADMIN_SECRET : SECRET;

	let token = await sign(userData,
		secret, { expiresIn: tokenTime } // expires in 1 hour ( 180000 )
	);
	return token;
};

const refreshToken = async(token, userData, tokenTime) => {

	if (token.startsWith('Bearer ')) {
		token = token.slice(7, token.length); // Remove Bearer from string
	}
	return verify(token, SECRET, async(err, decoded) => {
		if (err) {
			return { status: 'error', message: 'expired-token' };
		} else {
			if (decoded.user_id == userData.user_id) {
				let newToken = await authorize(userData, tokenTime);
				return { status: 'success', token: newToken };
			} else {
				return json_encode({ status: 'error', message: 'mismatch-token' });
			}
		}
	});

};

module.exports = {
	checkToken,
	authorize,
	refreshToken,
};