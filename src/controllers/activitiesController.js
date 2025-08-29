'use strict';

const dayjs = require('dayjs');

const { db } = require('../db');
const { userHelper, mailHelper } = require('../helpers');
const {
  ACTIVITY_CREATED_SUCCESS,
  ACTIVITY_UPDATED_SUCCESS,
  ACTIVITY_FETCH_SUCCESS,
  ACTIVITY_LIST_FETCH_SUCCESS,
  ACTIVITY_DOESNT_EXISTS_EXCEPTION,
  ACTIVITY_APPROVED_SUCCESS,
  ACTIVITY_APPROVAL_EXISTS,
  ACTIVITY_HISTORY_EXISTS_EXCEPTION,
  ACTIVITIES_DOESNT_EXISTS,
  ACTIVITY_ASSIGNEE_MISMATCH,
  ACTIVITY_ASSIGNEE_MISMATCH_EXCEPTION,
  ACTIVITY_DELETED_SUCCESS,
  ACTIVITY_DELETED_FAILURE,
} = require('../messages');
const {
	ROLES: {
    CHILD
  }
} = require('../constants');

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
    isSelfAssignment,
    assigneeId,
  } = req?.body;
  try {
    const userId = parseInt(req.userId);

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
      assigneeId: isSelfAssignment ? userId : assigneeId,
      assignedById: userId,
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
    let { startDate, endDate, page = 1, pageSize = 10, status = 'all', assigneeId } = req.body;
    assigneeId = assigneeId ? parseInt(assigneeId) : parseInt(req.userId);
    const pageOffset = pageSize * (page - 1);
    const filterStartDate = startDate ? dayjs(startDate).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");
    const filterEndDate = endDate ? dayjs(endDate).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD");

    let whereClause = {
      assigneeId,
      [Op.and]: [
        { startDate: { [Op.lte]: filterEndDate } },
        { endDate:   { [Op.gte]: filterStartDate } },
      ],
    };

    let includeClause = {
      model: db.ActivityHistory,
      as: 'activityHistory',
      required: false,
      attributes: ['id', 'approvalDate', 'assigneeId', 'approvedByName', 'approvedById'],
      on: {
        [Op.and]: [
          where(col('activityHistory.activityId'), '=', col('Activities.id')),
          where(col('activityHistory.assigneeId'), '=', assigneeId),
          literal(`DATE("activityHistory"."approvalDate") BETWEEN '${filterStartDate}' AND '${filterEndDate}'`)
        ]
      },
    };

    if (status === 'completed') {
      includeClause.required = true;
    } else if (status === 'notCompleted') {
      includeClause.required = false;
      whereClause['$activityHistory.id$'] = null;
    }
    
    const { count, rows } = await db.Activities.findAndCountAll({
      where: whereClause,
      include: includeClause,
      limit: pageSize,
      offset: pageOffset,
      order: [['id', 'DESC']],
      distinct: true,
      subQuery: false
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
 * @param {string[]?} attributes
 * @param {number[]?} allowedAssigneeIds
 */
const checkIfActivityIsActive = async (activityIds, attributes, allowedAssigneeIds) => {
  const currentDate = dayjs().format("YYYY-MM-DD"), currentDay = dayjs().format('dddd').toLowerCase();
  const where = {
    id: { [Op.in]: activityIds },
    startDate: { [Op.lte]: currentDate },
    endDate: { [Op.gte]: currentDate },
    [Op.and]: literal(`
      CASE
        WHEN "isRecurring" = true THEN '${currentDay}' = ANY("assignedDays")
        ELSE "assignedDays" IS NULL
      END
    `)
  };
  if (allowedAssigneeIds?.length) {
    where.assigneeId = { [Op.in]: allowedAssigneeIds };
  }
  return await db.Activities.findAll({
    attributes,
    where
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
 * Evaluate if assignee's level is increased and send mail
 *
 * @param {number} currentXP
 * @param {number} totalXP
 * @param {Object} userInfo
 * @param {Object} mailUserInfo
 * @param {import('sequelize').Transaction} t
 */
const evaluateLevelChange = async  (currentXP, totalXP, userInfo, mailUserInfo, t) => {
  try {
    const ownerId = userInfo?.ownerId || userInfo?.userId;
    const target = await db.Targets.findOne({
      attributes: ['id', 'targetXP'],
      where: { userId: ownerId },
    }, { transaction: t });

    const previousXP = currentXP - totalXP;
    const previousLevel = target?.targetXP && previousXP ? Math.floor(previousXP / target?.targetXP) : 0;
    const currentLevel = target?.targetXP && currentXP ? Math.floor(currentXP / target?.targetXP) : 0;

    if (currentLevel > previousLevel && userInfo?.email) {
      const mailData = {
        fullName: mailUserInfo?.fullName || userInfo?.fullName,
        parentFullName: mailUserInfo?.sendToParent ? mailUserInfo?.parentFullName : userInfo?.fullName,
        email: mailUserInfo?.email || userInfo?.email,
        currentLevel,
        currentXP,
        targetXP: target?.targetXP,
      };
      if (mailUserInfo?.sendToParent) {
        await mailHelper.sendLevelUpEmailToParent(mailData);
      } else {
        await mailHelper.sendLevelUpEmail(mailData);
      }
    }
    return true;
  } catch (error) {
    throw error;
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
    const { activityIds } = req.body, approvedById = req.userId, userInfo = req.user;
    const approvedByName = userInfo?.fullName;
    const currentDate = dayjs().format("YYYY-MM-DD HH:mm:ss");
    const primaryUserId = userInfo?.ownerId ? userInfo?.ownerId : approvedById;
    const associatedUsers = await userHelper.fetchAssociations(primaryUserId, null);
    let associatedUserIds = associatedUsers.map(user => user.associatedUserId);
    associatedUserIds = [ ...associatedUserIds, req.userId ];
    
    // Check if all activities are active and user have the access to approve them
    const activities = await checkIfActivityIsActive(activityIds, ['id', 'title', 'description', 'videoLink', 'xp', 'assigneeId', 'assignedById'], associatedUserIds);
    if (activities?.length !== activityIds.length) { return res.response(ACTIVITIES_DOESNT_EXISTS, {}, 400, ACTIVITY_DOESNT_EXISTS_EXCEPTION, false); }

    // Check if all activities are assigned to the same user
    const assignedUserIds = [...new Set(activities.map(activity => activity.assigneeId))];
    if (assignedUserIds.length > 1) { return res.response(ACTIVITY_ASSIGNEE_MISMATCH, {}, 400, ACTIVITY_ASSIGNEE_MISMATCH_EXCEPTION, false); }
    const assigneeId = activities[0].assigneeId;

    let mailUserInfo = null;
    if (assignedUserIds.length && assigneeId !== approvedById) {
      // Find assignee info
      mailUserInfo = await db.Users.findOne({
        attributes: ['id', 'email', 'fullName', 'firstName', 'lastName'],
        where: {
          id: assigneeId
        },
        include: {
          model: db.Roles,
          attributes: ['name'],
          required: true,
        }
      });
      if (mailUserInfo?.Role?.name === CHILD) {
        const parentInfo = await userHelper.fetchParent(assigneeId);
        mailUserInfo = {
          ...mailUserInfo.dataValues,
          fullName: mailUserInfo.fullName,
          email: parentInfo?.email,
          parentFullName: parentInfo?.fullName,
          sendToParent: true,
        }
      }
    }
    
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
      const [[updatedRows, count]] = await db.UserProgress.increment('currentXP', {
        by: totalXP, where: { userId: assigneeId }
      }, { returning: true, transaction: t });
      const currentXP = updatedRows[0]?.currentXP;

      return await evaluateLevelChange(currentXP, totalXP, userInfo, mailUserInfo, t);
    });

    return res.response(ACTIVITY_APPROVED_SUCCESS);
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

/**
 * Delete an activity
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const deleteActvity = async (req, res, next) => {
  try {
    const activityId = parseInt(req.params.id), userInfo = req.user;
    const primaryUserId = userInfo?.ownerId ? userInfo?.ownerId : req.userId;
    const associatedUsers = await userHelper.fetchAssociations(primaryUserId);
    let associatedUserIds = associatedUsers.map(user => user.associatedUserId);
    associatedUserIds = [ ...associatedUserIds, req.userId ];

    let where = { id: activityId };
    if (associatedUserIds?.length) {
      where.assigneeId = { [Op.in]: associatedUserIds };
    }
    const result = await db.Activities.destroy({ where })
    return res.response(result ? ACTIVITY_DELETED_SUCCESS : ACTIVITY_DELETED_FAILURE, result, result ? 200 : 404);
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};


module.exports = {
  createActivity,
  fetchActivities,
  approveActivity,
  fetchActivityDetails,
  deleteActvity,
}
