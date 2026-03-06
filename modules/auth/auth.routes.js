const express = require("express");
const router = express.Router();
const upload = require("@utils/upload.service");
const lowercaseEmailMiddleware = require("@middlewares/emailValidator.middleware");
const { signUpController, OtpVerification, loginController, logoutController, forgotPasswordController, verifyResetOtp, resetPasswordController } = require("./auth.controller");

router.post("/sign-up", lowercaseEmailMiddleware, upload.single('profileImage'), signUpController);

router.post("/verify", lowercaseEmailMiddleware, OtpVerification);

router.post("/login", lowercaseEmailMiddleware, loginController);

router.post('/logout', logoutController);

router.post('/forgot-Password', lowercaseEmailMiddleware, forgotPasswordController);

router.post("/verify-reset-otp", lowercaseEmailMiddleware, verifyResetOtp);

router.post("/reset-Password", lowercaseEmailMiddleware, resetPasswordController);


module.exports = router;