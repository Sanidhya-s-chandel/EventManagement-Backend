const express = require("express");
const router = express.Router();
const upload = require("@utils/upload.service");
const { lowercaseEmailMiddleware, verifyToken, authorizeRoles } = require("@middlewares/index.middleware");
const { getPaymentController, getMyPaymentsController, getPaymentByIdController, createPaymentController, verifyPaymentController, refundPaymentController } = require("./payment.controller");

router.get("/", verifyToken, authorizeRoles("admin", "dev"), getPaymentController);

router.get("/me", verifyToken, getMyPaymentsController);

router.get("/:paymentId", verifyToken, getPaymentByIdController);

router.post("/", verifyToken, createPaymentController);

router.post("/:paymentId/verify", verifyToken, authorizeRoles("admin", "dev"), verifyPaymentController);

router.post("/:paymentId/refund", verifyToken, authorizeRoles("admin", "dev"), refundPaymentController);

module.exports = router;