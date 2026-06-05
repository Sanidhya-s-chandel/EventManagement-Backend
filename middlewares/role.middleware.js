const AppError = require("@helpers/appError.helper");
const catchAsyncError = require("@helpers/catchAsyncError.helper");

const authorizeRoles = (...allowedRoles) => {

    return catchAsyncError(async (req, res, next) => {

        console.log("Role Authorization Middleware Triggered");

        if (!req.user) {

            console.log("No user found in request.");

            throw new AppError("Authentication required", 401);
        }

        console.log("Current User Role:", req.user.role);

        console.log("Allowed Roles:", allowedRoles);

        if (!allowedRoles.includes(req.user.role)) {

            console.log(`Access denied. Role ${req.user.role} is not authorized.`);

            throw new AppError("You do not have permission to access this resource", 403);
        }

        console.log("Role authorization successful.");

        next();

    });

};

module.exports = authorizeRoles;