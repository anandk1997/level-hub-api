"use strict";

const { Router } = require("express");
const router = Router();

const {
  levelCtrl,
  actCtrl,
  reportCtrl,
  dashCtrl,
  templateCtrl,
} = require("../../controllers");
const {
  levelValidation,
  activityValidation,
  dashValidation,
  reportsValidation,
  templateValidation,
} = require("../../validations");
const { auth } = require('../../middlewares');

// const applicationFilesUploader = require("../middlewares/applicationFilesUploader");

router.use(auth.checkToken);


// LEVEL
router.route("/level")
  .post(levelValidation.levelXPValidation, levelCtrl.saveLevelXP)
  .get(levelCtrl.fetchLevelInfo);

// ACTIVITIES
router.route("/activity")
  .post(activityValidation.saveActivityValidation, actCtrl.createActivity);
router.route("/activity/list")
  .post(activityValidation.fetchActivitiesValidation, actCtrl.fetchActivities);
router.route("/activity/approve")
  .put(activityValidation.approveActivityValidation, actCtrl.approveActivity);
router.route("/activity/:id")
  .get(actCtrl.fetchActivityDetails)
  .delete(actCtrl.deleteActvity);

// ACTIVITY TEMPLATE
router.route("/template")
  .get(templateValidation.fetchTemplatesValidation, templateCtrl.fetchActivityTemplates)
  .post(templateValidation.saveTemplateValidation, templateCtrl.saveActivityTemplate);
router.route("/template/:id")
  .get(templateCtrl.fetchActivityTemplateDetails)
  .delete(templateCtrl.deleteActivityTemplate);

// REPORTS
router.get("/report/activity", reportsValidation.generateReportValidation, reportCtrl.getMonthlyActivityReport);


// DASHBOARD
router.get("/dashboard/monthly", dashValidation.monthlyActivityHistValidation, dashCtrl.fetchMonthlyActivityHistory);
router.get("/dashboard/all", dashCtrl.fetchAllTimeActivities);
router.get("/dashboard/today", dashCtrl.fetchTodaysActivities);

module.exports = router;