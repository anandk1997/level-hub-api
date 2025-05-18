'use strict';

const { 
  COMMON_ERR_MSG,
} = require('../../config.js');

const { db } = require('../db');
const { userHelper } = require('../helpers');
const {
	USER_DOESNT_EXISTS,
	USER_DOESNT_EXISTS_EXCEPTION,
  LEVEL_SAVED_SUCCESS,
  LEVEL_FETCH_SUCCESS,
  LEVEL_NOT_SET
} = require('../messages.js');

const { fetchPrimaryUser } = userHelper;
const { Op } = db.Sequelize;

/**
 * Create/update the level XP for the user
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const saveLevelXP  = async (req, res, next) => {
  const { levelXP } = req.body;
  try {
    const user = await fetchPrimaryUser(req.email, null, ['id', 'email']);
    if (!user?.id) { return res.response(USER_DOESNT_EXISTS, {}, 401, USER_DOESNT_EXISTS_EXCEPTION, false); }

    const [level] = await db.Levels.upsert({
      userId: user.id,
      levelXP,
    }, {
      returning: true,
    });
    return res.response(LEVEL_SAVED_SUCCESS, level);
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

/**
 * Fetch current level information
 * 
 * @async
 * @function fetchActivities
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchLevelInfo = async (req, res, next) => {
  try {
    const user = await fetchPrimaryUser(req.email, null, ['id', 'email']);
    if (!user?.id) { return res.response(USER_DOESNT_EXISTS, {}, 401, USER_DOESNT_EXISTS_EXCEPTION, false); }
    const levelInfo = await db.Levels.findOne({
      attributes: ['id', 'levelXP', 'currentXP'],
      where: { userId: user.id },
    });
    return res.response(levelInfo?.id ? LEVEL_FETCH_SUCCESS : LEVEL_NOT_SET, levelInfo, 200, undefined, !!levelInfo?.id);
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

module.exports = {
  saveLevelXP,
  fetchLevelInfo,
}
