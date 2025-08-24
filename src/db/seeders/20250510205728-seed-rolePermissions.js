'use strict';

const {
  PERMISSIONS: {
    ACCOUNT_MANAGE,
    ACTIVITY_MANAGE,
    ACTIVITY_APPROVE,
    ACTIVITY_VIEW,
    USER_INVITE,
    TARGET_MANAGE,
    SUBACCOUNT_MANAGE,
    COACH_MANAGE,
    PLAN_SUBSCRIBE,
    CHILD_MANAGE,
    PLAN_MANAGE,
    SUBACCOUNT_VIEW,
  }
} = require('../../constants');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Mapping by role name -> array of permission keys (strings from your constants).
    // Use 'ALL' to mean "all permissions from the DB".
    const roleToPermissionKeys = {
      'ADMIN': [
        ACCOUNT_MANAGE,
        ACTIVITY_MANAGE,
        ACTIVITY_APPROVE,
        ACTIVITY_VIEW,
        USER_INVITE,
        TARGET_MANAGE,
        SUBACCOUNT_MANAGE,
        COACH_MANAGE,
        PLAN_SUBSCRIBE,
        CHILD_MANAGE,
        PLAN_MANAGE,
        SUBACCOUNT_VIEW
      ],
      'GYM.OWNER': [
        ACCOUNT_MANAGE,
        ACTIVITY_MANAGE,
        ACTIVITY_APPROVE,
        ACTIVITY_VIEW,
        TARGET_MANAGE,
        USER_INVITE,
        SUBACCOUNT_MANAGE,
        SUBACCOUNT_VIEW,
        COACH_MANAGE,
        PLAN_SUBSCRIBE,
      ],
      'COACH.OWNER': [
        ACCOUNT_MANAGE,
        ACTIVITY_MANAGE,
        ACTIVITY_APPROVE,
        ACTIVITY_VIEW,
        TARGET_MANAGE,
        USER_INVITE,
        SUBACCOUNT_MANAGE,
        SUBACCOUNT_VIEW,
        PLAN_SUBSCRIBE,
      ],
      'COACH.HEAD': [
        ACCOUNT_MANAGE,
        ACTIVITY_MANAGE,
        ACTIVITY_APPROVE,
        ACTIVITY_VIEW,
        USER_INVITE,
        SUBACCOUNT_MANAGE,
        SUBACCOUNT_VIEW,
      ],
      'COACH': [
        ACCOUNT_MANAGE,
        ACTIVITY_APPROVE,
        ACTIVITY_VIEW,
        SUBACCOUNT_VIEW,
      ],
      'PARENT.OWNER': [
        ACCOUNT_MANAGE,
        ACTIVITY_MANAGE,
        ACTIVITY_APPROVE,
        ACTIVITY_VIEW,
        TARGET_MANAGE,
        PLAN_SUBSCRIBE,
        CHILD_MANAGE,
      ],
      'PARENT': [
        ACCOUNT_MANAGE,
        ACTIVITY_VIEW,
        CHILD_MANAGE,
      ],
      'CHILD': [
        ACCOUNT_MANAGE,
        ACTIVITY_VIEW,
      ],
      'INDIVIDUAL.OWNER': [
        ACCOUNT_MANAGE,
        ACTIVITY_MANAGE,
        ACTIVITY_APPROVE,
        ACTIVITY_VIEW,
        TARGET_MANAGE,
        PLAN_SUBSCRIBE,
      ],
      'INDIVIDUAL': [
        ACCOUNT_MANAGE,
        ACTIVITY_VIEW,
      ],
    };

    // Fetch all permissions from DB
    const permissions = await queryInterface.sequelize.query(
      'SELECT id, key FROM permissions',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Fetch all roles from DB
    const roles = await queryInterface.sequelize.query(
      'SELECT id, name FROM roles',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!permissions.length) {
      throw new Error('No permissions found in DB. Seed the permissions table first.');
    }
    if (!roles.length) {
      throw new Error('No roles found in DB. Seed the roles table first.');
    }

    // build lookup maps
    const keyToPermissionId = {};
    permissions.forEach(p => { keyToPermissionId[p.key] = p.id; });

    const nameToRoleId = {};
    roles.forEach(r => { nameToRoleId[r.name] = r.id; });

    // check mapping references for missing roles
    const mappedRoleNames = Object.keys(roleToPermissionKeys);
    const missingRoles = mappedRoleNames.filter(n => !nameToRoleId[n]);
    if (missingRoles.length) {
      throw new Error(`Missing roles in DB required by seeder: ${missingRoles.join(', ')}. Seed roles first.`);
    }

    const rows = [];

    for (const [roleName, permissionSpec] of Object.entries(roleToPermissionKeys)) {
      const roleId = nameToRoleId[roleName];
      // permissionSpec is an array of keys
      const keys = Array.isArray(permissionSpec) ? permissionSpec : [];
      // detect missing permission keys
      const missingKeys = keys.filter(k => !keyToPermissionId[k]);
      if (missingKeys.length) {
        throw new Error(`Missing permission keys for role ${roleName}: ${missingKeys.join(', ')}. Seed permissions first.`);
      }
      const permissionIds = keys.map(k => keyToPermissionId[k]);

      for (const permissionId of permissionIds) {
        rows.push({
          roleId,
          permissionId,
        });
      }
    }

    if (rows.length) {
      await queryInterface.bulkInsert('rolePermissions', rows, {});
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('rolePermissions', null, { truncate: true, cascade: true });
  }
};
