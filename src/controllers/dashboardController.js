'use strict';

const dayjs = require('dayjs');

const { db } = require('../db');
const {
  ACTIVITY_GRAPH_FETCH_SUCCESS,
  DASH_ALL_STATS_FETCH_SUCCESS,
  DASH_TODAY_STATS_FETCH_SUCCESS,
  DASH_LEADERBOARD_FETCH_SUCCESS,
  DASH_USERS_FETCH_SUCCESS,
  DASH_INVITES_FETCH_SUCCESS,
  DASH_XP_FETCH_SUCCESS,
} = require('../messages');
const { userHelper } = require('../helpers');
const {
  ROLES: {
    PARENT,
    PARENT_OWNER,
    INDIVIDUAL,
    INDIVIDUAL_OWNER,
    CHILD
  }
} = require('../constants');
const { calculateLevel } = require('../utils');

const { Op, fn, col, where, literal, QueryTypes } = db.Sequelize;


/**
 * Fetch activity information for a monthly graph
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchMonthlyActivityHistory = async (req, res, next) => {
  try {
    const { date = dayjs().startOf('month').format("YYYY-MM-DD") } = req.query;
    const userId = req.query?.userId ? parseInt(req.query?.userId) : req.userId;

    const startDate = dayjs(date).startOf('month').format("YYYY-MM-DD HH:mm:ss");
    let endDate = dayjs(date).endOf('month').format("YYYY-MM-DD HH:mm:ss");

    if (dayjs().isBefore(dayjs(endDate))) {
      endDate = dayjs().format("YYYY-MM-DD HH:mm:ss");
    }

    /* const monthlyActivities = await db.ActivityHistory.findAll({
      attributes: [
        [fn('DATE', col('approvalDate')), 'approvalDate'], 
        [fn('COUNT', col('id')), 'activityCount'],
        [fn('SUM', col('xp')), 'totalXP']
      ],
      where: {
        assigneeId: userId,
        [Op.and]: [
          literal(`"approvalDate" BETWEEN '${startDate}' AND '${endDate}' `)
        ]
      },
      group: [fn('DATE', col('approvalDate'))],
      order: [['approvalDate', 'DESC']]
    }); */

    const rawQuery = `
      SELECT
        dates.day::date AS "approvalDate",
        COALESCE(COUNT(ah.id), 0) AS "activityCount",
        COALESCE(SUM(ah.xp), 0) AS "totalXP"
      FROM
        generate_series(
          :startDate::date,
          :endDate::date,
          interval '1 day'
        ) AS dates(day)
      LEFT JOIN "activityHistory" ah
        ON DATE(ah."approvalDate") = dates.day
        AND ah."assigneeId" = :userId
      GROUP BY dates.day
      ORDER BY dates.day ASC;
    `;

    const monthlyActivities = await db.sequelize.query(rawQuery, {
      replacements: {
        startDate,
        endDate,
        userId,
      },
      type: QueryTypes.SELECT
    });


    
    return res.response(ACTIVITY_GRAPH_FETCH_SUCCESS, { monthlyActivities });
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

/**
 * Fetch all time stats for user activity
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchAllTimeActivities = async (req, res, next) => {
  try {
    const userId = req.query?.userId ? parseInt(req.query?.userId) : req.userId;
    const completedResult = await db.ActivityHistory.findOne({
      attributes: [
        [fn('COUNT', col('id')), 'activityCount'],
        [fn('SUM', col('xp')), 'totalXP'],
      ],
      where: {
        assigneeId: userId,
      },
      group: ['assigneeId']
    });
    return res.response(DASH_ALL_STATS_FETCH_SUCCESS, { completed: completedResult });
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

/**
 * Fetch today's stats for user activities
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchTodaysActivities = async (req, res, next) => {
  try {
    const userId = req.query?.userId ? parseInt(req.query?.userId) : req.userId;
    const currentDate = dayjs().format("YYYY-MM-DD"), currentDay = dayjs().format('dddd').toLowerCase();
    const assignedStats = await db.Activities.findOne({
      attributes: [
        [fn('COUNT', col('id')), 'activityCount'],
        [fn('SUM', col('xp')), 'totalXP'],
      ],
      where: {
        assigneeId: userId,
        startDate: { [Op.lte]: currentDate },
        endDate: { [Op.gte]: currentDate },
        [Op.and]: literal(`
          CASE
            WHEN "isRecurring" = true THEN '${currentDay}' = ANY("assignedDays")
            ELSE "assignedDays" IS NULL
          END  
        `)
      },
      group: ['assigneeId']
    });

    const completedStats = await db.ActivityHistory.findOne({
      attributes: [
        [fn('COUNT', col('id')), 'activityCount'],
        [fn('SUM', col('xp')), 'totalXP'],
      ],
      where: {
        assigneeId: userId,
        [Op.and]: [
          where(fn('DATE', col('approvalDate')), currentDate)
        ]
      },
      group: ['assigneeId']
    });
    return res.response(DASH_TODAY_STATS_FETCH_SUCCESS, { assigned: assignedStats, completed: completedStats });
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

/**
 * Fetch leaderboard stats
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchLeaderboard = async (req, res, next) => {
  try {
    const userId = req.userId, userInfo = req.user, role = req.query.role;
		const ownerId = userInfo.ownerId || userInfo.userId;
    const whereRoleName = role !== "ALL" ? [role] : [ PARENT, PARENT_OWNER, INDIVIDUAL, INDIVIDUAL_OWNER, CHILD ];

    const target = await userHelper.fetchUserTarget(userId);

    const users = await db.Users.findAll({
      attributes: ['id', 'firstName', 'lastName', 'fullName', 'email', 'username'],
      where: {
        [Op.or]: {
          id: userId,
          ownerId,
        },
        isActive: true
      },
      include: [
        {
          model: db.UserProgress,
          attributes: ['id', 'currentXP']
        },
        {
          attributes: ['name'],
          model: db.Roles,
          where: {
            name: { [Op.iLike] : { [Op.any]: whereRoleName } }
          }
        }
      ],
      limit: 10,
      offset: 0,
      order: [[{ model: db.UserProgress }, 'currentXP', 'DESC']],
      subQuery: false
    });
    const leaderboard = users.map(user => {
			const userInfo = {
				...user.dataValues,
				targetXP: target?.targetXP,
        currentXP: user?.UserProgress?.currentXP,
	      level: calculateLevel(target?.targetXP, user?.UserProgress?.currentXP)
			};
			delete userInfo.UserProgress;
			return userInfo;
		});
    return res.response(DASH_LEADERBOARD_FETCH_SUCCESS, { leaderboard });
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

/**
 * Fetch all active users under an owner
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchActiveUsers = async (req, res, next) => {
  try {
		const ownerId = req.user?.ownerId || req.user?.userId, { type = 'all' } = req.query;
    let where = {
      ownerId,
      isActive: true,
    };
    if (type === 'monthly') {
      const startDate = dayjs().startOf('month').format('YYYY-MM-DD HH:mm:ss');
      const endDate = dayjs().endOf('month').format('YYYY-MM-DD HH:mm:ss');
      where = {
        ...where,
        [Op.and]: literal(`DATE("createdAt") BETWEEN '${startDate}' AND '${endDate}'`)
      }
    }
    const count = await db.Users.count({ where });
    return res.response(DASH_USERS_FETCH_SUCCESS, { count });
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

/**
 * Fetch count of pending invites
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchPendingInvites = async (req, res, next) => {
  try {
		const userInfo = req.user;
		const ownerId = userInfo.ownerId || userInfo.userId;

    const inviteCount = await db.Invites.count({
			where: {
        ownerId,
        status: 'pending',
        expiryDate: { [Op.gte]: dayjs().toDate() }
      },
		});
    return res.response(DASH_INVITES_FETCH_SUCCESS, { count: inviteCount });
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

/**
 * Fetch all cumlative XP
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchCumulativeXP = async (req, res, next) => {
  try {
		const userInfo = req.user;
		const ownerId = userInfo.ownerId || userInfo.userId;

    const historyResult = await db.ActivityHistory.findOne({
      attributes: [[fn('SUM', col('xp')), 'totalXP']],
      include: {
        model: db.Users,
        as: 'historyAssignee',
        where: { ownerId },
        attributes: [],
        required: true
      },
      group: ['xp'],
      subQuery: false
    });
    return res.response(DASH_XP_FETCH_SUCCESS, { totalXP: historyResult.dataValues.totalXP || 0 });
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

module.exports = {
  fetchMonthlyActivityHistory,
  fetchAllTimeActivities,
  fetchTodaysActivities,
  fetchLeaderboard,
  fetchActiveUsers,
  fetchPendingInvites,
  fetchCumulativeXP,
}
