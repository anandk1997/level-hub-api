"use strict";

const { Router } = require("express");
const router = Router();

const { authCtrl } = require("../../controllers");
const { authValidation } = require("../../validations");

// AUTH
router.post("/signup", authValidation.signupValidation, authCtrl.signup);
router.post("/signin", authValidation.signinValidation, authCtrl.signin);
router.post("/otp/verify", authValidation.verifyOtpValidation, authCtrl.verifyRegistrationOtp);
router.post("/otp/resend", authValidation.resendOtp, authCtrl.resendRegistrationOtp);
router.post("/password/forgot", authValidation.resendOtp, authCtrl.forgotPassword);
router.post("/password/reset", authValidation.resetPasswordValidation, authCtrl.resetPassword);
router.post("/password/change", authValidation.changePasswordValidation, authCtrl.changePassword);
router.post("/password/verify", authValidation.verifyOtpValidation, authCtrl.verifyResetOtp);

module.exports = router;