'use strict';

const dayjs = require('dayjs');

const { db } = require('../db');
// const { userHelper } = require('../helpers');
const {
  REPORT_FETCH_SUCCESS,
  SERVER_ERROR,
  FORBIDDEN_EXCEPTION,
  REPORT_FEEDBACK_SUCCESS
} = require('../messages');
const {
  ROLES: { CHILD }
} = require('../constants');
const { userHelper, mailHelper } = require('../helpers');
const { calculateLevel, calculateRemainingXP } = require('../utils');

const { QueryTypes } = db.Sequelize;


/**
 * Get a “target vs achieved” report for a given month
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
*/
const getMonthlyActivityReport = async (req, res, next) => {
  try {
    const reportMonth = req.query.date;
    const userId = req.query?.userId ? parseInt(req.query?.userId) : req.userId;

    const startDate = reportMonth ? dayjs(reportMonth).startOf('month').format("YYYY-MM-DD") : dayjs().startOf('month').format("YYYY-MM-DD");
    let endDate = reportMonth ? dayjs(reportMonth).endOf('month').format("YYYY-MM-DD") : dayjs().endOf('month').format("YYYY-MM-DD");

    if (dayjs().isBefore(dayjs(endDate))) {
      endDate = dayjs().format("YYYY-MM-DD");
    }

    const sqlQuery = `
      SELECT
        gs.day::date AS date,
        COALESCE(a.assigned_count,   0) AS total_assigned,
        COALESCE(a.assigned_xp,      0) AS total_assigned_xp,
        COALESCE(c.completed_count,  0) AS total_completed,
        COALESCE(c.completed_xp,     0) AS total_completed_xp
      FROM
        generate_series(
          :startDate::date,
          :endDate::date,
          interval '1 day'
        ) AS gs(day)
      
      -- Assigned on that day, only if within the date window AND matches recurring rules
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) AS assigned_count,
          SUM(xp)   AS assigned_xp
        FROM activities act
        WHERE
          act."assigneeId" = :userId
          AND act."startDate" <= gs.day
          AND act."endDate"   >= gs.day
          AND (
            act."isRecurring" = FALSE
            OR (
              act."isRecurring" = TRUE
              AND lower(to_char(gs.day, 'FMDay')) = ANY(act."assignedDays"::text[])
            )
          )
      ) AS a ON TRUE

      -- Completed on that day
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*)       AS completed_count,
          SUM(act.xp)    AS completed_xp
        FROM "activityHistory" ah
        JOIN activities act
          ON act.id = ah."activityId"
        WHERE
          ah."assigneeId" = :userId
          AND DATE(ah."approvalDate") = gs.day
      ) AS c ON TRUE

      ORDER BY gs.day;
    `;

    const report = await db.sequelize.query(sqlQuery, {
      replacements: { userId, startDate, endDate },
      type: QueryTypes.SELECT,
    });

    return res.response(REPORT_FETCH_SUCCESS, { report });
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

/**
 * Send feedback and report via email
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
*/
const sendFeedbackReport = async (req, res, next) => {
  try {
    const { userId, recipientEmail, recipientId, note = '' } = req.body, userInfo = req.user;
    const ownerId = userInfo?.ownerId || userInfo?.userId;

    const target = await userHelper.fetchUserTarget(ownerId);
    const user = await db.Users.findOne({
			attributes: ['id', 'fullName', 'firstName', 'lastName', 'email', 'username'],
      where: { id: userId, ownerId, isActive: true },
      include: [{
				attributes: ['name'],
				model: db.Roles,
			}, {
				model: db.UserProgress,
				attributes: ['id', 'currentXP'],
			}],
      subQuery: false
    });
    if (!user?.id) { return res.response(SERVER_ERROR, {}, 400, FORBIDDEN_EXCEPTION, false); }
    let recipientinfo = user;
    if (recipientId !== userId) {
      recipientinfo = await db.Users.findOne({
        attributes: ['id', 'fullName', 'firstName', 'lastName', 'email'],
        where: { id: recipientId, isActive: true }
      });
    }
    const monthStart = dayjs().startOf('month').format("YYYY-MM-DD");
    const mailData = {
      email: recipientinfo?.email || recipientEmail,
      recipientName: recipientinfo?.fullName,
      fullName: user?.fullName,
      role: user?.Role?.name,
      currentXP: user?.UserProgress?.currentXP,
      level: calculateLevel(target?.targetXP, user?.UserProgress?.currentXP),
      remainingXP: calculateRemainingXP(target?.targetXP, user?.UserProgress?.currentXP),
      url: `reports?assignee=${userId}&date=${monthStart}`,
      note: note ? note.trim() : '',
      isChild: user?.Role?.name === CHILD
    };
    // return res.json({ recipientinfo, mailData, user, target, userInfo, ownerId, userId, recipientId, recipientEmail, note });
    await mailHelper.sendFeedbackMail(mailData);

    return res.response(REPORT_FEEDBACK_SUCCESS);
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};


module.exports = {
  getMonthlyActivityReport,
  sendFeedbackReport
}
