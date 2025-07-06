'use strict';

const dayjs = require('dayjs');

const { db } = require('../db');
const {
  ACTIVITY_GRAPH_FETCH_SUCCESS,
  DASH_ALL_STATS_FETCH_SUCCESS,
  DASH_TODAY_STATS_FETCH_SUCCESS,
} = require('../messages');

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

module.exports = {
  fetchMonthlyActivityHistory,
  fetchAllTimeActivities,
  fetchTodaysActivities,
}
