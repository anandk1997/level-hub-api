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
  ACTIVITY_APPROVAL_EXISTS,
  ACTIVITY_HISTORY_EXISTS_EXCEPTION,
} = require('../messages.js');

const { fetchUser } = userHelper;
const { Op, fn, col, where, literal } = db.Sequelize;

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
    const activityId = parseInt(req.params.id);
    const activity = await db.Activities.findByPk(activityId);
    return res.response(ACTIVITY_FETCH_SUCCESS, { activity });
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

/**
 * Fetch if activity lies on current date
 * 
 * @param {number} activityId
 * @param {Array?} attributes
 */
const checkIfActivityIsActive = async (activityId, attributes) => {
  const currentDate = dayjs().format("YYYY-MM-DD");
  return await db.Activities.findOne({
    attributes,
    where: {
      id: activityId,
      startDate: { [Op.lte]: currentDate },
      endDate: { [Op.gte]: currentDate }
    }
  });
};

/**
 * Check if activity is already approved on CURRENT DATE
 * 
 * @param {number} activityId
 */
const checkIfActivityIsApproved = async (activityId) => {
  return await db.ActivityHistory.findOne({
    attributes: ['id', 'activityId', 'approvalDate'],
    where: {
      activityId,
      [Op.and]: [
        where(fn('DATE', col('approvalDate')), literal('CURRENT_DATE'))
      ]
    },
  });
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
    const activityId = parseInt(req.params.id), approvedById = parseInt(req.userId), approvedByName = "Test UserName";
    const currentDate = dayjs().format("YYYY-MM-DD HH:mm:ss");
    const currentDay = dayjs().format("dddd").toLowerCase();

    const activity = await checkIfActivityIsActive(activityId, ['id', 'title', 'description', 'videoLink', 'xp', 'assigneeId', 'assignedById']);
    if (!activity?.id) { return res.response(ACTIVITY_DOESNT_EXISTS, {}, 401, ACTIVITY_DOESNT_EXISTS_EXCEPTION, false); }

    const checkIfAlreadyApproved = await checkIfActivityIsApproved(activityId);
    if (checkIfAlreadyApproved?.id) {
      return res.response(ACTIVITY_APPROVAL_EXISTS, {}, 401, ACTIVITY_HISTORY_EXISTS_EXCEPTION, false);
    }

    const history = {
      activityId,
      title: activity.title,
      description: activity.description,
      videoLink: activity.videoLink,
      xp: activity.xp,
      assigneeId: activity.assigneeId,
      assignedById: activity.assignedById,
      approvalDate: currentDate,
      approvalDay: currentDay,
      approvedByName,
      approvedById,
    };

    const result = await db.ActivityHistory.create(history);
    await db.Levels.increment('currentXP', { by: activity.xp, where: { userId: activity.assigneeId } });
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
