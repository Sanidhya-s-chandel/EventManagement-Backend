const AppError = require("@helpers/AppError.helper");
const catchAsyncError = require("@helpers/catchAsyncError.helper");

const checkActiveUser = catchAsyncError(async (req, res, next) => {

    console.log("ACTIVE USER CHECK");

    if (!req.user) {

        console.log("❌ Authenticated user not found.");

        throw new AppError("Authentication required.", 401);
    }

    if (!req.user.isActive) {

        console.log(`❌ Inactive user attempted to access the API: ${req.user.userId}`);

        throw new AppError("Your account has been deactivated.", 403);
    }

    console.log(`✅ Active user verified: ${req.user.userId}`);

    next();
});

module.exports = checkActiveUser;