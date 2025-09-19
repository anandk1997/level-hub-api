"use strict";

const { Router } = require("express");
const router = Router();

const {
  templateCtrl,
  planCtrl
} = require("../../controllers");
const {
  planValidation,
} = require("../../validations");
const {
  auth,
  permissions: { checkPermssion, checkAssociatedUser }
} = require('../../middlewares');
const {
  PERMISSIONS: {
    PLAN_MANAGE,
  },
  USER_ASSOCIATIONS: {
    GYM_COACH
  }
} = require('../../constants');

// const applicationFilesUploader = require("../middlewares/applicationFilesUploader");

router.use(auth.checkToken);

console.log("HERE")
// LEVEL
router.route("/plans")
  .get(planValidation.fetchPlansValidation, checkPermssion(PLAN_MANAGE), planCtrl.fetchAllPlans)
  .post(planValidation.createPlanValidation, checkPermssion(PLAN_MANAGE), planCtrl.createPlan);
router.route("/plans/:id")
  .get(checkPermssion(PLAN_MANAGE), planCtrl.fetchPlanDetails)
  .put(planValidation.createPlanValidation, checkPermssion(PLAN_MANAGE), planCtrl.updatePlan);
router.put('/plans/:id/:status', planValidation.tooglePlanValidation, checkPermssion(PLAN_MANAGE), planCtrl.tooglePlan);

// router.get("/plans/default/stripe", checkPermssion(PLAN_MANAGE), planCtrl.createFreemiumPlansStripe);
router.get("/plans/default/db", checkPermssion(PLAN_MANAGE), planCtrl.createFreemiumPlanDB);
router.get("/plans/sync/db", checkPermssion(PLAN_MANAGE), planCtrl.syncPlansFromStripe);


router.route("/template/bulk/:id").get(templateCtrl.savePredefiendTemplates)

module.exports = router;