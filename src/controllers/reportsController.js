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
} = require('../messages');

const { fetchUser } = userHelper;
const { Op, fn, col, where, literal } = db.Sequelize;


/**
 * Fetch activities reports for a month
 *
 * @async
 * @function fetchActivities
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const generateReport = async (req, res, next) => {
  
  try {
    return res.json({ query: req.query });
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

module.exports = {
  generateReport
}
