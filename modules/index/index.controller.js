const os = require("os");

const apiInfo = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Event Management API is running 🚀",
    version: "v1",
    timestamp: new Date().toISOString(),
  });
};

const healthCheck = (req, res) => {
  res.status(200).json({
    success: true,
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
};

const systemStats = (req, res) => {
  res.status(200).json({
    success: true,
    platform: os.platform(),
    cpuArchitecture: os.arch(),
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
};

module.exports = {
  apiInfo,
  healthCheck,
  systemStats,
};