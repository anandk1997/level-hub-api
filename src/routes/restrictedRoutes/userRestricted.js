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
  childCtrl,
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
    ACCOUNT_MANAGE,
    ACTIVITY_APPROVE,
    ACTIVITY_MANAGE,
    ACTIVITY_VIEW,
    LEVEL_MANAGE,
    USER_INVITE,
    SUBACCOUNT_MANAGE,
  }
} = require('../../constants');

// const applicationFilesUploader = require("../middlewares/applicationFilesUploader");

router.use(auth.checkToken);


// LEVEL
router.route("/level")
  .post(checkPermssion(LEVEL_MANAGE), levelValidation.levelXPValidation, levelCtrl.saveLevelXP)
  .get(checkPermssion(ACTIVITY_VIEW), levelCtrl.fetchLevelInfo);

// ACTIVITIES
router.route("/activity")
  .post(checkPermssion(ACTIVITY_MANAGE), activityValidation.saveActivityValidation, actCtrl.createActivity);
router.route("/activity/list")
  .post(checkPermssion(ACTIVITY_MANAGE),activityValidation.fetchActivitiesValidation, actCtrl.fetchActivities);
router.route("/activity/approve")
  .put(checkPermssion(ACTIVITY_APPROVE), activityValidation.approveActivityValidation, actCtrl.approveActivity);
router.route("/activity/:id")
  .all(checkPermssion(ACTIVITY_MANAGE))
  .get(actCtrl.fetchActivityDetails)
  .delete(actCtrl.deleteActvity);

// ACTIVITY TEMPLATE
router.route("/template")
  .all(checkPermssion(ACTIVITY_MANAGE))
  .get(templateValidation.fetchTemplatesValidation, templateCtrl.fetchActivityTemplates)
  .post(templateValidation.saveTemplateValidation, templateCtrl.saveActivityTemplate);
router.route("/template/:id")
  .all(checkPermssion(ACTIVITY_MANAGE))
  .get(templateCtrl.fetchActivityTemplateDetails)
  .delete(templateCtrl.deleteActivityTemplate);

// REPORTS
router.get("/report/activity", checkPermssion(ACTIVITY_VIEW), reportsValidation.generateReportValidation, reportCtrl.getMonthlyActivityReport);


// DASHBOARD
router.get("/dashboard/monthly", checkPermssion(ACTIVITY_VIEW), dashValidation.monthlyActivityHistValidation, dashCtrl.fetchMonthlyActivityHistory);
router.get("/dashboard/all", checkPermssion(ACTIVITY_VIEW), dashCtrl.fetchAllTimeActivities);
router.get("/dashboard/today", checkPermssion(ACTIVITY_VIEW), dashCtrl.fetchTodaysActivities);

// USERS
router.put("/password/change", checkPermssion(ACCOUNT_MANAGE), userValidation.changePasswordValidation, userCtrl.changePassword);
router.route("/profile")
  .all(checkPermssion(ACCOUNT_MANAGE))
  .get(userCtrl.fetchUserProfile)
  .put(userValidation.updateProfileValidation, userCtrl.updateUserProfile);

// LEVEL
router.post("/child/create", checkPermssion(SUBACCOUNT_MANAGE), userValidation.childAccountValidation, childCtrl.createChildAccount);
  // .post(checkPermssion(SUBACCOUNT_MANAGE), levelValidation.levelXPValidation, levelCtrl.saveLevelXP)
  // .get(checkPermssion(ACTIVITY_VIEW), levelCtrl.fetchLevelInfo);

module.exports = router;