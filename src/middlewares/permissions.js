'use strict';


const { db } = require('../db');
const {
  FORBIDDEN,
  FORBIDDEN_EXCEPTION,
} = require('../messages');


/**
 * Middleware to check if the authenticated user has the specified permission.
 *
 * @param {string} permissionKey - The key of the permission to check for the user.
 * @returns {Function} Express middleware function that checks user permissions.
 *
 * @async
 * @function
 * @throws {Object} 500 - If an error occurs during permission checking.
 * @example app.use('/admin', checkPermssion('ADMIN_ACCESS'));
 */
const checkPermssion = (permissionKey) => {
  return async (req, res, next) => {
    try {
      const userId = req.userId;
      const userInfo = await db.Users.findOne({
        attributes: ['id', 'roleId', 'isPrimaryAccount'],
        where: { id: userId },
        include: {
          model: db.Roles,
          attributes: ['id', 'name', 'isSuperAdmin'],
          required: true,
          include: {
            attributes: ['id', 'key'],
            model: db.Permissions,
            as: 'permissions',
            required: true,
            through: { attributes: [] },
            where: { key: permissionKey }
          }
        },
        subQuery: false
      });
      if (!userInfo?.Role?.permissions?.length) {
        return res.response(FORBIDDEN, {}, 403, FORBIDDEN_EXCEPTION, false);
      }
      next();
    } catch (error) {
      return next({ error, statusCode: 500, message: error?.message });
    }
  };
  
};

module.exports = {
	checkPermssion,
};