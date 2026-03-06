const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { generateUserId } = require("@helpers/customIdGenerator.helper");
const response = require("@helpers/response.helper");
const AppError = require("@helpers/AppError.helper");
const catchAsyncError = require("@helpers/catchAsyncError.helper");
const { User } = require("@models/index.model");
const { sendEmail } = require("@utils/email.service");

module.exports.signUpController = catchAsyncError(async (req, res) => {
    const { firstName, email, phone, dob } = req.body;

    console.log(`Creating the user with Name: ${firstName}`);

    if (!firstName || !email || !phone) {
        throw new AppError("First name, email, and phone are required", 400);
    };

    const [existingUser, newUserId] = await Promise.all([
        User.findOne({ email: email.toLowerCase() }).select("_id").lean(),
        generateUserId()
    ]);

    if (existingUser) {
        throw new AppError("User with this email already exists", 409);
    }

    if (dob) {
        const [day, month, year] = dob.split("-");
        req.body.dob = new Date(`${year}-${month}-${day}`);
        console.log("Formatted DOB:", req.body.dob);
    }

    console.log(`Generated User ID: ${newUserId}`);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpirationTime = new Date(Date.now() + 20 * 60 * 1000);

    console.log(`Generated OTP: ${otp} (expires at ${new Date(otpExpirationTime).toISOString()})`);

    const profileImage = req.file?.path || null;
    if (profileImage) {
        console.log("Profile image uploaded at:", profileImage);
    } else {
        console.log("No profile image provided.");
    };

    const userObj = new User({
        ...req.body,
        firstName,
        email: email.toLowerCase(),
        phone,
        profileImage,
        otp,
        otpExpirationTime,
        userId: newUserId,
    });

    const mailOptions = {
        from: process.env.EMAIL,
        to: userObj.email,
        subject: "Email Verification - One Time Password (OTP)",
        text: `Dear ${userObj?.firstName}, your userId is ${userObj.userId},\n\nThank you for registering with us.\n\nYour OTP is: ${otp}\n\nIt is valid for 20 minutes.\n\nTeam Eventally.Co.`,
    };

    await Promise.all([
        userObj.save(),
        sendEmail(mailOptions.to, mailOptions.subject, mailOptions.text),
    ]);

    const userData = userObj.toObject();
    delete userData.otp;
    delete userData.otpExpirationTime;

    console.log("userData :", userData);

    return response.created(res, 201, "User created successfully", userData);
});

module.exports.OtpVerification = catchAsyncError(async (req, res) => {
    const { email, otp, password } = req.body;

    console.log("Verifying OTP for email:", email);

    if (!email || !otp || !password) {
        throw new AppError("Email, OTP, and password are required", 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        console.log("User not found for email:", email);
        throw new AppError("User not found.", 404);
    }

    if (user.otpVerified || user.isEmailVerified) {
        console.log("OTP already verified.");
        throw new AppError("OTP has already been verified.", 400);
    };

    const isOtpValid = user.otp === otp;
    const isOtpExpired = Date.now() > user.otpExpirationTime;

    if (!isOtpValid || isOtpExpired) {
        console.log("Invalid or expired OTP.");
        throw new AppError("Invalid or expired OTP.", 400);
    };

    const hashedPassword = await bcrypt.hash(password, Number(process.env.SALT_ROUNDS));
    console.log("Password hashed successfully.");

    user.password = hashedPassword;
    user.otp = null;
    user.otpExpirationTime = null;
    user.otpVerified = true;
    user.isEmailVerified = true;

    await user.save();
    console.log("User updated and saved.");
    const token = jwt.sign(
        { email: user.email, id: user._id, isAdmin: user.isAdmin, isSubscribed: user.isSubscribed },
        process.env.JWT_KEY,
        { expiresIn: "7d" }
    );

    console.log("JWT token generated.");

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    console.log("Token sent in cookie.");

    return response.success(res, "OTP verified successfully", { token });
});

module.exports.loginController = catchAsyncError(async (req, res) => {

    const { email, password } = req.body;

    console.log("Login attempt with email:", req.body.email);

    if (!email || !password) {
        throw new AppError("Email and password are required", 400);
    }

    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select("password email role userId");

    if (!user) {
        console.log("User not found for email:", email);
        throw new AppError("Invalid email or password.", 401);
    }

    if (!user.password) {
        throw new AppError("Please login using Google or generate a password.", 400);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        console.log("Invalid password for email:", email);
        throw new AppError("Invalid email or password.", 401);
    }

    const token = jwt.sign(
        { _id: user._id, email: user.email, id: user.userId, role: user.role },
        process.env.JWT_KEY,
        { expiresIn: "1d" }
    );

    console.log("JWT token generated for login.");

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000
    });

    console.log("Token sent in cookie for login.");

    return response.success(res, "Login successful", { token, userId: user.userId, role: user.role });
});

module.exports.logoutController = catchAsyncError(async (req, res) => {

    const token = req.cookies.token;
    // console.log("Loging out user with email:", req.user?.email);

    if (!token) {
        return response.success(res, "User already logged out");
    }

    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    });

    console.log("Token cookie cleared for logout.");
    return response.success(res, "Logout successful");
});

module.exports.forgotPasswordController = catchAsyncError(async (req, res) => {

    const { email } = req.body;

    console.log("Forgot password request received for email:", email);

    if (!email) {
        throw new AppError("Email is required", 400);
    }

    const user = await User.findOne({ email: email });

    if (!user) {
        throw new AppError("User not found with this email", 404);
    }

    if (!user.isEmailVerified || !user.password) {
        throw new AppError("This email is not verified or password is not set.", 400);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpirationTime = new Date(Date.now() + 20 * 60 * 1000);

    console.log(`Generated OTP for password reset: ${otp} (expires at ${new Date(otpExpirationTime).toISOString()})`);

    user.otp = otp;
    user.otpExpirationTime = otpExpirationTime;
    user.otpVerified = false;

    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "Reset Your Password - OTP Verification",
        text: `Dear ${user.firstName},\n\nYou have requested to reset your password.\n\nYour One Time Password (OTP) is: ${otp}\n\nPlease use this OTP to reset your password. This OTP will expire in 20 minutes.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nTeam Eventually.Co.`
    };

    await Promise.all([user.save(), sendEmail(mailOptions.to, mailOptions.subject, mailOptions.text)]);

    console.log(`OTP sent to ${email} for password reset.`);

    return response.success(res, "OTP sent to email for password reset");
});

module.exports.verifyResetOtp = catchAsyncError(async (req, res) => {

    const { email, otp } = req.body;

    console.log("Password reset OTP verification request received for email:", email);

    if (!email || !otp) {
        console.log("Missing email or OTP in request.");
        throw new AppError("Email and OTP are required", 400);
    }

    const normalizedEmail = email.toLowerCase();

    console.log("Searching user with email:", normalizedEmail);

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
        console.log("No user found with email:", normalizedEmail);
        throw new AppError("User not found", 404);
    }

    if (!user.otp) {
        console.log("No OTP found for this user.");
        throw new AppError("No OTP request found for this user", 400);
    }

    console.log("Stored OTP:", user.otp);
    console.log("Provided OTP:", otp);

    const isOtpValid = user.otp === otp;
    const isOtpExpired = new Date() > user.otpExpirationTime;

    if (!isOtpValid) {
        console.log("OTP mismatch for email:", normalizedEmail);
        throw new AppError("Invalid OTP", 400);
    }

    if (isOtpExpired) {
        console.log("OTP expired for email:", normalizedEmail);
        throw new AppError("OTP has expired", 400);
    }

    console.log("OTP verified successfully for email:", normalizedEmail);

    user.otpVerified = true;

    await user.save();

    console.log("User OTP verification status updated in database.");

    return response.success(res, "OTP verified successfully. You can now reset your password.");

});

module.exports.resetPasswordController = catchAsyncError(async (req, res) => {
    console.log("Reset password request received with email:", req.body.email);

    if (!req.body.email || !req.body.password) {
        console.log("Email or password missing in request.");
        throw new AppError("Email and new password are required", 400);
    }

    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        console.log("No user found with email:", req.body.email);
        throw new AppError("User not found", 404);
    }

    if (!user.otpVerified) {
        console.log("OTP not verified for email:", req.body.email);
        throw new AppError("OTP verification required before resetting password", 400);
    }

    const hashedPassword = await bcrypt.hash(req.body.password, Number(process.env.SALT_ROUNDS));
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpirationTime = null;
    user.otpVerified = false;

    await user.save();

    console.log("Password reset successfully for email:", req.body.email);

    return response.success(res, "Password reset successful");
});