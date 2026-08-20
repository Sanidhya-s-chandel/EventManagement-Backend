const express = require("express");
const router = express.Router();
const upload = require("@utils/upload.service");
const { lowercaseEmailMiddleware, verifyToken, authorizeRoles } = require("@middlewares/index.middleware");
const { getAllBookingsController, getMyBookingsController, getBookingController, createBookingController, cancelBookingController } = require("./booking.controller");

router.get("/", verifyToken, authorizeRoles("admin", "dev"), getAllBookingsController);

router.get("/me", verifyToken, getMyBookingsController);

router.get("/:bookingId", verifyToken, getBookingController);

router.post("/", verifyToken, createBookingController);

router.patch("/:bookingId/cancel", verifyToken, cancelBookingController);

module.exports = router;