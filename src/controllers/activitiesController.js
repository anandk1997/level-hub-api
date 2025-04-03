'use strict';

const dayjs = require('dayjs');

const { db } = require('../db');
const { userHelper } = require('../helpers');
const {
	USER_DOESNT_EXISTS,
	USER_DOESNT_EXISTS_EXCEPTION,
  ACTIVITY_CREATED_SUCCESS,
  ACTIVITY_UPDATED_SUCCESS,
  ACTIVITY_FETCH_SUCCESS,
  ACTIVITY_LIST_FETCH_SUCCESS,
  ACTIVITY_DOESNT_EXISTS,
  ACTIVITY_DOESNT_EXISTS_EXCEPTION,
  ACTIVITY_APPROVED_SUCCESS,
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
    return res.response(ACTIVITY_LIST_FETCH_SUCCESS, { count, rows });
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

/**
 * Fetch activity details
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchActivityDetails = async (req, res, next) => {
  try {
    const activityId = req.params.id;
    const activity = await db.Activities.findByPk(activityId);
    return res.response(ACTIVITY_FETCH_SUCCESS, { activity });
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};


/**
 * Approve an activity
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const approveActivity = async (req, res, next) => {
  try {
    const activityId = parseInt(req.params.id), approvedById = 1, approvedByName = "Test UserName";
    // const activityId = req.params.id, approvedById = req.userId;
    const activity = await db.Activities.findByPk(activityId);
    if (!activity?.id) { return res.response(ACTIVITY_DOESNT_EXISTS, {}, 401, ACTIVITY_DOESNT_EXISTS_EXCEPTION, false); }
    const currentDate = dayjs().format("YYYY-MM-DD HH:mm:ss");
    const currentDay = dayjs().format("dddd").toLowerCase();
    return res.json({ currentDate, currentDay, activity, activityId, approvedById, approvedByName, body: req.body });

    const history = {
      activityId,
      title: activity.title,
      description: activity.description,
      videoLink: activity.videoLink,
      assigneeId: activity.assigneeId,
      assignedById: activity.assignedById,
      approvalDate: currentDate,
      approvalDay: currentDay,
      approvedByName,
      approvedById,
    };

    const result = await db.ActivityHistory.create(history);
    return res.response(ACTIVITY_APPROVED_SUCCESS, result);

  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

module.exports = {
  createActivity,
  fetchActivities,
  approveActivity,
  fetchActivityDetails,
}
