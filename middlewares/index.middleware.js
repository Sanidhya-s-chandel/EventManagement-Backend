const { verifyToken } = require("./auth.middleware");
const lowercaseEmailMiddleware = require("./emailValidator.middleware");
const globalErrorHandler = require("./error.middleware");
const notFound = require("./notFound.middleware");
const authorizeRoles = require("./role.middleware");

module.exports = {lowercaseEmailMiddleware,verifyToken,globalErrorHandler,notFound,authorizeRoles};