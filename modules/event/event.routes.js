const express = require("express");
const router = express.Router();
const upload = require("@utils/upload.service");
const { lowercaseEmailMiddleware, verifyToken, authorizeRoles } = require("@middlewares/index.middleware");
const { createEventController, getEventController, getAllEventController, updateEventController, deleteEventController } = require("./event.controller");

router.get("/", verifyToken, getAllEventController);

router.get("/:eventId", verifyToken, getEventController);

router.post("/create", verifyToken, upload.fields([
    {
        name: "bannerImage",
        maxCount: 1
    },
    {
        name: "galleryImages",
        maxCount: 10
    }
]), createEventController);

router.put("/:eventId", verifyToken, upload.fields([
    { name: "bannerImage", maxCount: 1 },
    { name: "galleryImages", maxCount: 10 }
]), updateEventController);

router.delete("/:eventId", verifyToken, deleteEventController);

module.exports = router;