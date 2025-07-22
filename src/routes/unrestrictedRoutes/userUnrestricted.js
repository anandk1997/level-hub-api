"use strict";

const { Router } = require("express");
const router = Router();

const { authCtrl, inviteCtrl } = require("../../controllers");
const { authValidation, inviteValidation } = require("../../validations");

// AUTH
router.post("/signup", authValidation.signupValidation, authCtrl.signup);
router.post("/signin", authValidation.signinValidation, authCtrl.signin);
router.post("/otp/verify", authValidation.verifyOtpValidation, authCtrl.verifyRegistrationOtp);
router.post("/otp/resend", authValidation.resendOtp, authCtrl.resendRegistrationOtp);
router.post("/password/forgot", authValidation.resendOtp, authCtrl.forgotPassword);
router.put("/password/reset", authValidation.resetPasswordValidation, authCtrl.resetPassword);
router.post("/password/verify", authValidation.verifyOtpValidation, authCtrl.verifyResetOtp);
// router.put("/password/change", authValidation.changePasswordValidation, authCtrl.changePassword);

// INVITE
router.post("/invite/verify", inviteValidation.verifyInviteValidation, inviteCtrl.verifyInvite);


module.exports = router;