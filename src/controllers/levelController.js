'use strict';

const { db } = require('../db');
const { userHelper } = require('../helpers');
const {
  LEVEL_SAVED_SUCCESS,
  LEVEL_FETCH_SUCCESS,
  LEVEL_NOT_SET,
  LEVEL_NOT_SET_EXCEPTION
} = require('../messages.js');

const { fetchPrimaryUser, fetchOwner } = userHelper;

/**
 * Create/update the level XP for the user
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const saveTargetXP  = async (req, res, next) => {
  const { targetXP } = req.body;
  try {
    const userId = req.userId;
    const [level] = await db.Targets.upsert({
      userId,
      targetXP,
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
    let userId = req.userId, userInfo = req.user;
    const associatedUserId = req.query?.userId ? parseInt(req.query?.userId) : null;

    if (associatedUserId) {
      userId = associatedUserId;
      userInfo = { userId: associatedUserId };
    }
    const primaryUserId = await fetchOwner(userId, userInfo);
    // return res.json({ primaryUserId, associatedUserId, userId, userInfo })
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
      level: target?.targetXP && progress?.currentXP ? Math.floor(progress?.currentXP / target?.targetXP) : 0
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
