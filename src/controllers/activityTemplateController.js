'use strict';

const { db } = require('../db');
const {
  ACTIVITY_TEMPLATE_CREATED_SUCCESS,
  ACTIVITY_TEMPLATE_UPDATED_SUCCESS,
  ACTIVITY_TEMPLATES_FETCH_SUCCESS,
  ACTIVITY_TEMPLATE_DETAIL_FETCH_SUCCESS,
  ACTIVITY_TEMPLATE_DELETED_SUCCESS,
} = require('../messages.js');

const { Op, fn, col, where, literal } = db.Sequelize;

/**
 * Create or update an activity
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const saveActivityTemplate  = async (req, res, next) => {
  try {
    const userId = parseInt(req.userId);
    const {
      templateId,
      title,
      description,
      videoLink,
      xp,
    } = req?.body;

    await db.ActivityTemplates.upsert({
      id: templateId,
      title,
      description,
      videoLink,
      xp,
      userId,
    }, {
      conflictFields: ["id"]
    });
    return res.response(templateId ? ACTIVITY_TEMPLATE_UPDATED_SUCCESS : ACTIVITY_TEMPLATE_CREATED_SUCCESS);
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

/**
 * Fetch activity template listing
 *
 * @async
 * @function fetchActivityTemplates
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchActivityTemplates = async (req, res, next) => {
  try {
    let { page = 1, pageSize = 10, search } = req.query;
    const userId = parseInt(req.userId);
    page = parseInt(page);
    pageSize = parseInt(pageSize);
    const pageOffset = pageSize * (page - 1);
    
    let whereClause = { userId };
    if (search) {
      whereClause = {
        ...whereClause,
        title: { [Op.iLike]: `%${search}%` }
      };
    }
    
    const { count, rows } = await db.ActivityTemplates.findAndCountAll({
      attributes: ['id', 'title', 'description', 'videoLink', 'xp', 'userId'],
      where: whereClause,
      limit: pageSize,
      offset: pageOffset,
      order: [['title', 'ASC']]
    });
    return res.response(ACTIVITY_TEMPLATES_FETCH_SUCCESS, { count, templates: rows });
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

/**
 * Fetch activity template details
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const fetchActivityTemplateDetails = async (req, res, next) => {
  try {
    const activityId = parseInt(req.params.id);
    const activity = await db.ActivityTemplates.findByPk(activityId);
    return res.response(ACTIVITY_TEMPLATE_DETAIL_FETCH_SUCCESS, { activity }, 200, undefined, !!activity?.length);
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};

/**
 * Delete activity template
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const deleteActivityTemplate = async (req, res, next) => {
  try {
    const activityId = parseInt(req.params.id);
    const result = await db.ActivityTemplates.destroy({ where: { id: activityId } });
    return res.response(ACTIVITY_TEMPLATE_DELETED_SUCCESS, undefined, result ? 200 : 404);
  } catch (error) {
    return next({ error, statusCode: 500, message: error?.message });
  }
};



module.exports = {
  saveActivityTemplate,
  fetchActivityTemplates,
  fetchActivityTemplateDetails,
  deleteActivityTemplate,
}
