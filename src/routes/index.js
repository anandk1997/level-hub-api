"use strict";

const userUnrestricted = require('./unrestrictedRoutes/userUnrestricted');
const userRestricted = require('./restrictedRoutes/userRestricted');
const adminRestricted = require('./restrictedRoutes/adminRestricted');

module.exports = {
    userUnrestricted,
    userRestricted,
    adminRestricted
};