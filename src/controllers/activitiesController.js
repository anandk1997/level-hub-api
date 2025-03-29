'use strict';

const { 
  COMMON_ERR_MSG,
} = require('../../config.js');

const { db } = require('../db');
const { userHelper } = require('../helpers');
const {
	USER_DOESNT_EXISTS,
	USER_DOESNT_EXISTS_EXCEPTION,
  LEVEL_SAVED_SUCCESS: LEVEL_SET_SUCCESS
} = require('../messages.js');

const { fetchPrimaryUser } = userHelper;
const { Op } = db.Sequelize;

/**
 * Sign Up user
 * 
 * @param {Object} req 
 * @param {Object} res 
 * @param {Function} next 
 */
const createActivity  = async (req, res, next) => {
  const request = req.body;
  return res.json({ request, email: req.email, username: req.username, role: req.role });
  try {
    const user = await fetchPrimaryUser(req.email, null, ['id', 'email']);

    if (!user?.id) { return res.response(USER_DOESNT_EXISTS, {}, 401, USER_DOESNT_EXISTS_EXCEPTION, false); }

    const result = await db.Levels.create({
      userId: user.id,
      levelXP,
      currentXP: 0
    });
    return res.response(LEVEL_SET_SUCCESS, result);
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

module.exports = {
  createActivity,
}
