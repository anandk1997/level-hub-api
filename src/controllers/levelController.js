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
  LEVEL_NOT_SET,
  LEVEL_NOT_SET_EXCEPTION
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
const saveTargetXP  = async (req, res, next) => {
  const { levelXP } = req.body;
  try {
    const userId = req.userId;
    // return res.json({ levelXP, userId });
    const [level] = await db.Targets.upsert({
      userId,
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
    const userId = req.userId, userInfo = req.user;
    const primaryUserId = await fetchPrimaryUser(userId, userInfo);
    // return res.json({ userInfo, primaryUserId, userId });
    const target = await db.Targets.findOne({
      attributes: ['id', 'targetXP'],
      where: { userId: primaryUserId },
    });
    if (!target?.id) { return res.response(LEVEL_NOT_SET, {}, 200, LEVEL_NOT_SET_EXCEPTION, false) }
    const progress = await db.UserProgress.findOne({
      attributes: ['id', 'currentXP'],
      where: { userId },
    });
    let levelInfo = {
      id: target?.id,
      targetXP: target?.targetXP,
      currentXP: progress?.currentXP || 0,
      level: target?.targetXP && progress?.levelXP ? Math.floor(progress?.currentXP / target?.targetXP) + 1 : 1
    }
    return res.response(LEVEL_FETCH_SUCCESS, levelInfo, 200);
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

module.exports = {
  saveTargetXP,
  fetchLevelInfo,
}
