'use strict';

const dayjs = require('dayjs');
const { 
  COMMON_ERR_MSG,
} = require('../../config.js');

const { db } = require('../db');
const { userHelper } = require('../helpers');
const {
	USER_DOESNT_EXISTS,
	USER_DOESNT_EXISTS_EXCEPTION,
  ACTIVITY_CREATED_SUCCESS,
  ACTIVITY_UPDATED_SUCCESS,
  ACTIVITY_FETCH_SUCCESS,
} = require('../messages.js');

const { fetchUser } = userHelper;
const { Op } = db.Sequelize;

/**
 * Create or update an activity
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const createActivity  = async (req, res, next) => {
  const {
    activityId,
    title,
    description,
    videoLink,
    xp,
    isRecurring,
    assignedDays,
    startDate,
    endDate,
    isSelfAssignment
  } = req.body;
  try {
    const user = await fetchUser(req.email, null, ['id', 'email']);
    if (!user?.id) { return res.response(USER_DOESNT_EXISTS, {}, 401, USER_DOESNT_EXISTS_EXCEPTION, false); }
    // return res.json({ user, request: req.body, email: req.email, username: req.username, role: req.role });

    const result = await db.Activities.upsert({
      id: activityId,
      title,
      description,
      videoLink,
      xp,
      isRecurring,
      assignedDays: isRecurring ? assignedDays : null,
      startDate,
      endDate: isRecurring ? endDate : startDate,
      assigneeId: user?.id,
      assignedById: isSelfAssignment ? user?.id : user?.id,
    });
    return res.response(activityId ? ACTIVITY_UPDATED_SUCCESS : ACTIVITY_CREATED_SUCCESS);
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

/**
 * Fetch activities listing
 * 
 * @async
 * @function fetchActivities
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchActivities = async (req, res, next) => {
  const { status } = req.query;

  try {
    let where = {};
    if (status) {
      const currentDate = dayjs().format("YYYY-MM-DD");
      where = {
        ...where,
        startDate: { [Op.lte]: currentDate },
        endDate: { [Op.gte]: currentDate }
      };
    }
    
    const { count, rows } = await db.Activities.findAndCountAll({ where });
    return res.response(ACTIVITY_FETCH_SUCCESS, { count, rows });
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

module.exports = {
  createActivity,
  fetchActivities,
}
