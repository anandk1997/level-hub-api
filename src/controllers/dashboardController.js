'user strict';

const { Op } = require('sequelize');
const moment = require('moment');
// const { Op, fn, col, where } = require('sequelize');

const db = require("../models");
const config = require('../../config');
const { ErrorHandler } = require('../helpers/errorhandler');

const getTotalUsers = async () => {
  return await db.users.count({ where: { role: 'user' } });
};

const getTotalApplications = async () => {
  return await db.applications.count();
};

const getTodayApplications = async () => {
  const dayStart = moment().format('YYYY-MM-DD 00:00:00');
  const dayEnd = moment().format('YYYY-MM-DD 23:59:59');

  return await db.applications.count({
    where: {
      createdAt: {
        [Op.gte]: dayStart,
        [Op.lte]: dayEnd
      }
    }
  });
};


/**
 * Fetch dashboard stats
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const get_dashboard_stats = async (req, res, next) => {
	try {
    const totalUser = await getTotalUsers();
    const totalApplication = await getTotalApplications();
    const todayApplication = await getTodayApplications();

		return res.json({ success: true, message: 'Fetched user details successfully!', data: { totalUser, totalApplication, todayApplication } });
	} catch (error) {
		return next(new ErrorHandler(500, config.common_err_msg, error));
	}
};


module.exports = {
	get_dashboard_stats
};