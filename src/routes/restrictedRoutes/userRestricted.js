"use strict";

const { Router } = require("express");
const router = Router();

const {
  levelCtrl,
  actCtrl,
  reportCtrl,
  dashCtrl,
  templateCtrl,
  userCtrl,
} = require("../../controllers");
const {
  levelValidation,
  activityValidation,
  dashValidation,
  reportsValidation,
  templateValidation,
  userValidation,
} = require("../../validations");
const {
  auth,
  permissions: { checkPermssion }
} = require('../../middlewares');
const {
  PERMISSIONS: {
    ACCOUNT_MANAGEMENT,
    ACTIVITY_APPROVAL,
    ACTIVITY_MANAGEMENT,
    INVITE_USERS,
    LEVEL_MANAGEMENT,
  }
} = require('../../constants');

// const applicationFilesUploader = require("../middlewares/applicationFilesUploader");

router.use(auth.checkToken);


// LEVEL
router.route("/level")
  .all(checkPermssion(LEVEL_MANAGEMENT))
  .post(levelValidation.levelXPValidation, levelCtrl.saveLevelXP)
  .get(levelCtrl.fetchLevelInfo);

// ACTIVITIES
router.route("/activity")
  .post(checkPermssion(ACTIVITY_MANAGEMENT), activityValidation.saveActivityValidation, actCtrl.createActivity);
router.route("/activity/list")
  .post(checkPermssion(ACTIVITY_MANAGEMENT),activityValidation.fetchActivitiesValidation, actCtrl.fetchActivities);
router.route("/activity/approve")
  .put(checkPermssion(ACTIVITY_APPROVAL), activityValidation.approveActivityValidation, actCtrl.approveActivity);
router.route("/activity/:id")
  .all(checkPermssion(ACTIVITY_MANAGEMENT))
  .get(actCtrl.fetchActivityDetails)
  .delete(actCtrl.deleteActvity);

// ACTIVITY TEMPLATE
router.route("/template")
  .all(checkPermssion(ACTIVITY_MANAGEMENT))
  .get(templateValidation.fetchTemplatesValidation, templateCtrl.fetchActivityTemplates)
  .post(templateValidation.saveTemplateValidation, templateCtrl.saveActivityTemplate);
router.route("/template/:id")
  .all(checkPermssion(ACTIVITY_MANAGEMENT))
  .get(templateCtrl.fetchActivityTemplateDetails)
  .delete(templateCtrl.deleteActivityTemplate);

// REPORTS
router.get("/report/activity", checkPermssion(ACTIVITY_MANAGEMENT), reportsValidation.generateReportValidation, reportCtrl.getMonthlyActivityReport);


// DASHBOARD
router.get("/dashboard/monthly", checkPermssion(ACTIVITY_MANAGEMENT), dashValidation.monthlyActivityHistValidation, dashCtrl.fetchMonthlyActivityHistory);
router.get("/dashboard/all", checkPermssion(ACTIVITY_MANAGEMENT), dashCtrl.fetchAllTimeActivities);
router.get("/dashboard/today", checkPermssion(ACTIVITY_MANAGEMENT), dashCtrl.fetchTodaysActivities);

// USERS
router.put("/password/change", checkPermssion(ACCOUNT_MANAGEMENT), userValidation.changePasswordValidation, userCtrl.changePassword);
router.route("/profile")
  .all(checkPermssion(ACCOUNT_MANAGEMENT))
  .get(userCtrl.fetchUserProfile)
  .put(userValidation.updateProfileValidation, userCtrl.updateUserProfile);

module.exports = router;