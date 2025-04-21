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
  ACTIVITIES_DOESNT_EXISTS,
  ACTIVITY_ASSIGNEE_MISMATCH,
  ACTIVITY_ASSIGNEE_MISMATCH_EXCEPTION,
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
  } = req?.body;
  try {
    const user = await fetchUser(req.email, null, ['id', 'email']);
    if (!user?.id) { return res.response(USER_DOESNT_EXISTS, {}, 400, USER_DOESNT_EXISTS_EXCEPTION, false); }
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
  
  try {
    let { startDate, endDate, page = 1, pageSize = 10, status = 'all' } = req.body;
    const userId = parseInt(req.userId)
    const pageOffset = pageSize * (page - 1);
    startDate = startDate ? dayjs(startDate).startOf('date').format("YYYY-MM-DD HH:mm:ss") : dayjs().startOf('date').format("YYYY-MM-DD HH:mm:ss");
    endDate = endDate ? dayjs(endDate).endOf('date').format("YYYY-MM-DD") : dayjs().endOf('date').format("YYYY-MM-DD HH:mm:ss");

    let whereClause = {
      startDate: { [Op.lte]: startDate },
      endDate: { [Op.gte]: endDate },
      assigneeId: userId,
    };
    // return res.json({ havingClause, body: req.body, startDate, endDate, page, pageOffset, where });

    let includeClause = {
      model: db.ActivityHistory,
      as: 'activityHistory',
      required: false,
      attributes: ['id', 'approvalDate', 'assigneeId', 'approvedByName', 'approvedById'],
      on: {
        [Op.and]: [
          where(col('activityHistory.activityId'), '=', col('Activities.id')),
          where(col('activityHistory.assigneeId'), '=', userId),
          literal(`DATE("activityHistory"."approvalDate") BETWEEN '${startDate}' AND '${endDate}'`)
        ]
      },
    };

    if (status === 'completed') {
      includeClause.required = true;
    } else if (status === 'notCompleted') {
      whereClause[Op.and] = [
        ...(whereClause[Op.and] || []),
        literal(`NOT EXISTS (
          SELECT 1 FROM "activityHistory" AS "ah" 
          WHERE "ah"."activityId" = "Activities"."id"
          AND "ah"."assigneeId" = ${userId}
          AND DATE("ah"."approvalDate") BETWEEN '${startDate}' AND '${endDate}'
        )`)
      ];
    }

    
    const { count, rows } = await db.Activities.findAndCountAll({
      where: whereClause,
      include: includeClause,
      /* include: {
        model: db.ActivityHistory,
        as: 'activityHistory',
        required: false,
        where: {
          [Op.and]: [
            where(fn('DATE', col('activityHistory.approvalDate')), {
              [Op.between]: [startDate, endDate],
            }),
            { assigneeId: userId },
          ],
        },
        attributes: ['id', 'approvalDate', 'assigneeId', 'approvedByName', 'approvedById']
      }, */
      limit: pageSize,
      offset: pageOffset,
      order: [['id', 'DESC']],
      distinct: true
    });
    const activities = rows.map(activity => ({
      ...activity.dataValues,
      activityHistory: activity?.activityHistory?.length ? activity?.activityHistory[0]: [],
      completed: !!activity?.activityHistory?.length
    }));
    return res.response(ACTIVITY_LIST_FETCH_SUCCESS, { count, activities });
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
 * @param {Array} activityIds
 * @param {Array?} attributes
 */
const checkIfActivityIsActive = async (activityIds, attributes) => {
  const currentDate = dayjs().format("YYYY-MM-DD"), currentDay = dayjs().format('dddd').toLowerCase();
  return await db.Activities.findAll({
    attributes,
    where: {
      id: { [Op.in]: activityIds },
      startDate: { [Op.lte]: currentDate },
      endDate: { [Op.gte]: currentDate },
      [Op.and]: literal(`
        CASE
          WHEN "isRecurring" = true THEN '${currentDay}' = ANY("assignedDays")
          ELSE "assignedDays" IS NULL
        END  
      `)
    }
  });
};

/**
 * Check if activity is already approved on CURRENT DATE
 * 
 * @param {Array} activityIds
 */
const checkIfActivityIsApproved = async (activityIds) => {
  return await db.ActivityHistory.findAll({
    attributes: ['id', 'activityId', 'approvalDate'],
    where: {
      activityId: { [Op.in]: activityIds },
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
    const { activityIds } = req.body, approvedById = parseInt(req.userId), approvedByName = "Test UserName";
    const currentDate = dayjs().format("YYYY-MM-DD HH:mm:ss");
    
    // Check if all activities are active
    const activities = await checkIfActivityIsActive(activityIds, ['id', 'title', 'description', 'videoLink', 'xp', 'assigneeId', 'assignedById']);
    if (activities?.length !== activityIds.length) { return res.response(ACTIVITIES_DOESNT_EXISTS, {}, 400, ACTIVITY_DOESNT_EXISTS_EXCEPTION, false); }

    // Check if all activities are assigned to the same user
    const assignedUserIds = [...new Set(activities.map(activity => activity.assigneeId))];
    if (assignedUserIds.length > 1) { return res.response(ACTIVITY_ASSIGNEE_MISMATCH, {}, 400, ACTIVITY_ASSIGNEE_MISMATCH_EXCEPTION, false); }
    
    // Check if activity is already approved on CURRENT DATE
    const checkIfAlreadyApproved = await checkIfActivityIsApproved(activityIds);
    if (checkIfAlreadyApproved?.length) {
      return res.response(ACTIVITY_APPROVAL_EXISTS, {}, 400, ACTIVITY_HISTORY_EXISTS_EXCEPTION, false);
    }
    
    const txn = await db.sequelize.transaction(async (t) => {
      const histories = activities.map(activity => ({
        activityId: activity.id,
        title: activity.title,
        description: activity.description,
        videoLink: activity.videoLink,
        xp: activity.xp,
        assigneeId: activity.assigneeId,
        assignedById: activity.assignedById,
        approvalDate: currentDate,
        approvedByName,
        approvedById,
      }));
      const totalXP = activities.reduce((total, activity) => total + activity.xp, 0);
      const result = await db.ActivityHistory.bulkCreate(histories, { transaction: t });   
      return await db.Levels.increment('currentXP', {
        by: totalXP, where: { userId: activities[0].assigneeId }
      }, { transaction: t });
    });

    return res.response(ACTIVITY_APPROVED_SUCCESS);
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
