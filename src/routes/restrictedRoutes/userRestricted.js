"use strict";

const { Router } = require("express");
const router = Router();

const {
  levelCtrl,
  actCtrl,
  reportCtrl,
  dashCtrl
} = require("../../controllers");
const {
  levelValidation,
  activityValidation,
  dashValidation,
  reportsValidation
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
  .get(actCtrl.fetchActivityDetails);


// REPORTS
router.get("/report/activity", reportsValidation.generateReportValidation, reportCtrl.generateReport);


// DASHBOARD
router.get("/dashboard/monthly", dashValidation.monthlyActivityHistValidation, dashCtrl.fetchMonthlyActivityHistory);

module.exports = router;