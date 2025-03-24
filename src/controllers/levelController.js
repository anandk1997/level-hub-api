'use strict';

const { 
  COMMON_ERR_MSG,
} = require('../../config.js');

const { db } = require('../db');
const { userHelper } = require('../helpers');
const {
	USER_DOESNT_EXISTS,
	USER_DOESNT_EXISTS_EXCEPTION,
  LEVEL_SET_SUCCESS
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
const saveLevelXP  = async (req, res, next) => {
  const { levelXP } = req.body;
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
  saveLevelXP,
}
