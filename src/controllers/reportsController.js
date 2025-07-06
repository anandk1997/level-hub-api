'use strict';

const dayjs = require('dayjs');

const { db } = require('../db');
// const { userHelper } = require('../helpers');
const { REPORT_FETCH_SUCCESS } = require('../messages');

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
}

module.exports = {
  getMonthlyActivityReport,
}
