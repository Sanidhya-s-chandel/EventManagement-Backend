const Response = require("@helpers/response.helper");

const globalErrorHandler = (err, req, res, next) => {

  console.error("❌ Error:", err.message);
  console.error("📍 Route:", req.originalUrl);
  console.error("📦 Method:", req.method);
  console.error("📚 Stack:", err.stack);

  return Response.error(
    res,
    err.message || "Internal Server Error",
    err.status || 500
  );
};

module.exports = globalErrorHandler;