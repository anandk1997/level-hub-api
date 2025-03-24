"use strict";

const userUnrestricted = require('./unrestrictedRoutes/userUnrestricted');
const userRestricted = require('./restrictedRoutes/userRestricted');

module.exports = {
    userUnrestricted,
    userRestricted
};