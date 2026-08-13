const jwt = require("jsonwebtoken");
const AppError = require("@helpers/appError.helper");
const catchAsyncError = require("@helpers/catchAsyncError.helper");
const { User } = require("@models/index.model");

module.exports.verifyToken = catchAsyncError(async (req, res, next) => {

    console.log("Auth Middleware Triggered.");

    const token = req.cookies?.token;

    if (!token) {
        throw new AppError("Authentication required. Please login.", 401);
    }

    const decoded = jwt.verify(
        token,
        process.env.JWT_KEY
    );

    //console.log("Decoded Token :",decoded);
    //req.user = decoded;

    console.log(`User decoded successfully: ${decoded.id}`);

    const user = await User.findById(decoded.id)
        .select("_id userId firstName lastName email role isAdmin isActive profileImage")
        .lean();

    if (!user) {
        throw new AppError("User account not found.", 401);
    }

    if (!user.isActive) {
        throw new AppError("Your account has been deactivated.", 403);
    }

    req.user = user;

    console.log(`User authenticated successfully: ${user.userId}`);

    next();
});