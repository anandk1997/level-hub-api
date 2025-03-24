"use strict";

const { Router } = require("express");
const router = Router();

const { levelCtrl } = require("../../controllers");
const { levelValidation } = require("../../validations");
const { auth } = require('../../middlewares');

// const applicationFilesUploader = require("../middlewares/applicationFilesUploader");

router.use(auth.checkToken);


// LEVEL
router.post("/level", levelValidation.levelXPValidation, levelCtrl.saveLevelXP);

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