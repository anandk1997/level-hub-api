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
  inviteCtrl,
} = require("../../controllers");
const {
  levelValidation,
  activityValidation,
  dashValidation,
  reportsValidation,
  templateValidation,
  userValidation,
  inviteValidation,
} = require("../../validations");
const {
  auth,
  permissions: { checkPermssion, checkAssociatedUser }
} = require('../../middlewares');
const {
  PERMISSIONS: {
    ACCOUNT_MANAGE,
    ACTIVITY_APPROVE,
    ACTIVITY_MANAGE,
    ACTIVITY_VIEW,
    TARGET_MANAGE,
    USER_INVITE,
    SUBACCOUNT_MANAGE,
  }
} = require('../../constants');

// const applicationFilesUploader = require("../middlewares/applicationFilesUploader");

router.use(auth.checkToken);


// LEVEL
router.route("/level")
  .post(checkPermssion(TARGET_MANAGE), levelValidation.targetXPValidation, levelCtrl.saveTargetXP)
  .get(checkPermssion(ACTIVITY_VIEW), checkAssociatedUser('query', 'userId'), levelCtrl.fetchLevelInfo);

// ACTIVITIES
router.route("/activity")
  .post(checkPermssion(ACTIVITY_MANAGE), checkAssociatedUser('body', 'assigneeId'), activityValidation.saveActivityValidation, actCtrl.createActivity);
router.route("/activity/list")
  .post(checkPermssion(ACTIVITY_VIEW), checkAssociatedUser('body', 'assigneeId'), activityValidation.fetchActivitiesValidation, actCtrl.fetchActivities);
router.route("/activity/approve")
  .put(checkPermssion(ACTIVITY_APPROVE), activityValidation.approveActivityValidation, actCtrl.approveActivity);
router.route("/activity/:id")
  .get(checkPermssion(ACTIVITY_VIEW), actCtrl.fetchActivityDetails)
  .delete(checkPermssion(ACTIVITY_MANAGE), actCtrl.deleteActvity);

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
router.get("/report/activity", checkPermssion(ACTIVITY_VIEW), checkAssociatedUser('query', 'userId'), reportsValidation.generateReportValidation, reportCtrl.getMonthlyActivityReport);


// DASHBOARD
router.get("/dashboard/monthly", checkPermssion(ACTIVITY_VIEW), checkAssociatedUser('query', 'userId'), dashValidation.monthlyActivityHistValidation, dashCtrl.fetchMonthlyActivityHistory);
router.get("/dashboard/all", checkPermssion(ACTIVITY_VIEW), checkAssociatedUser('query', 'userId'), dashCtrl.fetchAllTimeActivities);
router.get("/dashboard/today", checkPermssion(ACTIVITY_VIEW), checkAssociatedUser('query', 'userId'), dashCtrl.fetchTodaysActivities);
router.get("/dashboard/leaderboard", checkPermssion(SUBACCOUNT_MANAGE), dashCtrl.fetchLeaderboard);

// USERS
router.put("/password/change", checkPermssion(ACCOUNT_MANAGE), userValidation.changePasswordValidation, userCtrl.changePassword);
router.route("/profile")
  .all(checkPermssion(ACCOUNT_MANAGE))
  .get(userCtrl.fetchUserProfile)
  .put(userValidation.updateProfileValidation, userCtrl.updateUserProfile);

// CHILD MANAGEMENT
router.route("/child")
  .all(checkPermssion(SUBACCOUNT_MANAGE))
  .post(userValidation.childAccountValidation, childCtrl.createChildAccount)
  .put(userValidation.updateChildValidation, childCtrl.updateChild)
  .get(childCtrl.fetchChildren);
router.put("/child/password/reset", checkPermssion(SUBACCOUNT_MANAGE), userValidation.resetChildPasswordValidation, childCtrl.resetChildPassword);
router.delete("/child/:id", checkPermssion(SUBACCOUNT_MANAGE), childCtrl.deleteChild);

router.get("/user/associated", checkPermssion(ACTIVITY_VIEW), userCtrl.fetchAssociatedUsers);

// INVITE 
router.route("/invite")
  .all(checkPermssion(USER_INVITE))
  .post(inviteValidation.sendInviteValidation, inviteCtrl.sendInvite)
  .get(inviteValidation.fetchInvitesValidation, inviteCtrl.fetchInvites);
router.route("/invite/:id")
  .all(checkPermssion(USER_INVITE))
  .get(inviteCtrl.fetchInviteDetails)
  .delete(inviteCtrl.deleteInvite);


// send
// resend
// delete
// fetch

module.exports = router;