'use strict';


const { db } = require('../db');
const { checkIfUserAssociated } = require('../helpers/userHelper');
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
  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  return async (req, res, next) => {
    try {
      const userId = req.userId;
      const userInfo = await db.Users.findOne({
        attributes: ['id', 'email', 'firstName', 'lastName', 'username', 'fullName', 'roleId', 'isPrimaryAccount', 'ownerId'],
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
      req.user = {
        ...req.user,
        fullName: userInfo?.fullName,
        email: userInfo?.email,
        isPrimaryAccount: userInfo?.isPrimaryAccount,
        roleId: userInfo?.roleId,
        username: userInfo?.username,
        firstName: userInfo?.firstName,
        lastName: userInfo?.lastName,
        ownerId: userInfo?.ownerId,
        role: userInfo?.Role?.name,
      };
      next();
    } catch (error) {
      return next({ error, statusCode: 500, message: error?.message });
    }
  };
  
};


/**
 * Check if given userId is assoicated to the logged-in user
 *
 * @param {string?} type
 * @param {string?} key
 */
const checkAssociatedUser = (type = 'query', key = 'userId') => {
  /**
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  return async (req, res, next) => {
    try {
      const primaryUserId = parseInt(req.userId), userInfo = req.user;
      let associatedUserId = req[type][key] ? parseInt(req[type][key]) : req[type][key];
      if (!associatedUserId || primaryUserId === associatedUserId) { return next(); }
      if (!userInfo?.isPrimaryAccount) { return res.response(FORBIDDEN, {}, 403, FORBIDDEN_EXCEPTION, false); }
      associatedUserId = parseInt(associatedUserId);
      const isAssociated = await checkIfUserAssociated(primaryUserId, associatedUserId);
      if (!isAssociated) { return res.response(FORBIDDEN, {}, 403, FORBIDDEN_EXCEPTION, false); }
      next();
    } catch (error) {
      return next({ error, statusCode: 500, message: error?.message });
    }
  }
};

module.exports = {
	checkPermssion,
  checkAssociatedUser,
};