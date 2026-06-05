const jwt = require("jsonwebtoken");
const AppError = require("@helpers/appError.helper");
const catchAsyncError = require("@helpers/catchAsyncError.helper");

module.exports.verifyToken = catchAsyncError(async (req, res, next) => {

    console.log("Auth Middleware Triggered.");

    const token = req.cookies?.token;

    if (!token) {
        throw new AppError("Authentication required. Please login.",401);
    }

    const decoded = jwt.verify(
        token,
        process.env.JWT_KEY
    );

    //console.log("Decoded Token :",decoded);

    req.user = decoded;

    console.log(`User authenticated successfully: ${decoded.id}`);

    next();

});