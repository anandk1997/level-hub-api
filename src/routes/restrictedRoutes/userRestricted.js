"use strict";

const { Router } = require("express");
const router = Router();

const { levelCtrl, actCtrl } = require("../../controllers");
const { levelValidation, activityValidation } = require("../../validations");
const { auth } = require('../../middlewares');

// const applicationFilesUploader = require("../middlewares/applicationFilesUploader");

router.use(auth.checkToken);


// LEVEL
router.route("/level")
  .post(levelValidation.levelXPValidation, levelCtrl.saveLevelXP)
  .get(levelCtrl.fetchLevelInfo);

// ACTIVITIES
router.route("/activity")
  .post(activityValidation.saveActivityValidation , actCtrl.createActivity)
  .get(activityValidation.fetchActivitiesValidation, actCtrl.fetchActivities);
router.route("/activity/:id")
  .get(actCtrl.fetchActivityDetails);
router.route("/activity/approve/:id")
  .put(activityValidation.approveActivityValidation, actCtrl.approveActivity);

// APPLICATIONS
// router.route('/application').post(applicationFilesUploader, applCtrl.save_application);
// router.post('/applications', applValidation.userApplicationListing, applCtrl.get_user_applications);
// router.get('/applications/:id', applCtrl.get_application_details);
// PROFILE
// router.route('/profile')
// 	.get(userCtrl.get_user_profile)
// 	.put(userValidation.updateProfileValidation, userCtrl.update_user_profile);
// router.put("/profile/update_password", userValidation.updatePasswordValidation, userCtrl.update_user_password);

// router.get('/states', stateCtrl.get_all_states);

module.exports = router;