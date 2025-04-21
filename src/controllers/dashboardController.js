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
  ACTIVITY_GRAPH_FETCH_SUCCESS,
} = require('../messages');

const { fetchUser } = userHelper;
const { Op, fn, col, where, literal } = db.Sequelize;


/**
 * Fetch activity information for a monthly graph
 *
 * @async
 * @function fetchActivities
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchMonthlyActivityHistory = async (req, res, next) => {
  try {
    const { date = dayjs().startOf('month').format("YYYY-MM-DD") } = req.query;
    const startDate = dayjs(date).startOf('month').format("YYYY-MM-DD HH:mm:ss");
    let endDate = dayjs(date).endOf('month').format("YYYY-MM-DD HH:mm:ss");

    if (dayjs().isBefore(dayjs(endDate))) {
      endDate = dayjs().format("YYYY-MM-DD HH:mm:ss");
    }

    const monthlyActivities = await db.ActivityHistory.findAll({
      attributes: [
        [fn('DATE', col('approvalDate')), 'approvalDate'], 
        [fn('COUNT', col('id')), 'activityCount'],
        [fn('SUM', col('xp')), 'totalXP']
      ],
      where: {
        [Op.and]: [
          literal(`DATE("approvalDate") BETWEEN '${startDate}' AND '${endDate}' `)
        ]
      },
      group: [fn('DATE', col('approvalDate'))],
      order: [['approvalDate', 'DESC']]
    });
    
    return res.response(ACTIVITY_GRAPH_FETCH_SUCCESS, { monthlyActivities });
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

module.exports = {
  fetchMonthlyActivityHistory
}
