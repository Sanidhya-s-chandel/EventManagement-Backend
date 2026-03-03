const express = require("express");
const router = express.Router();

const { apiInfo, healthCheck, systemStats } = require("./index.controller");

/**
 * @route   GET /api/v1
 * @desc    API base info
 * @access  Public
 */
router.get("/", apiInfo);

/**
 * @route   GET /api/v1/health
 * @desc    Health check
 * @access  Public
 */
router.get("/health", healthCheck);

/**
 * @route   GET /api/v1/stats
 * @desc    System statistics
 * @access  Public (Can secure later)
 */
router.get("/stats", systemStats);

module.exports = router;