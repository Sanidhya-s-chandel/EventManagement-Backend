const express = require("express");
const router = express.Router();
const upload = require("@utils/upload.service");
const { lowercaseEmailMiddleware, verifyToken, authorizeRoles } = require("@middlewares/index.middleware");
const { signUpController, OtpVerification, loginController, logoutController, forgotPasswordController, verifyResetOtp, resetPasswordController, resendOtpPasswordController, resendOtpController, refreshTokenController, testAuthController, getMe } = require("./auth.controller");


router.get("/me", verifyToken, authorizeRoles("Dev"), getMe);

router.get("/test-auth", lowercaseEmailMiddleware, verifyToken, authorizeRoles("Dev"), testAuthController);

router.post("/sign-up", lowercaseEmailMiddleware, upload.single('profileImage'), signUpController);

router.post("/verify", lowercaseEmailMiddleware, OtpVerification);

router.post("/login", lowercaseEmailMiddleware, loginController);

router.post('/logout', logoutController);

router.post('/forgot-Password', lowercaseEmailMiddleware, forgotPasswordController);

router.post("/verify-reset-otp", lowercaseEmailMiddleware, verifyResetOtp);

router.post("/reset-Password", lowercaseEmailMiddleware, resetPasswordController);

router.post("/resend-otp", lowercaseEmailMiddleware, resendOtpController);

router.post("/resend-reset-otp", lowercaseEmailMiddleware, resendOtpPasswordController);

router.post("/refresh-token", lowercaseEmailMiddleware, refreshTokenController);

module.exports = router;