const express = require("express");
const router = express.Router();
const upload = require("@utils/upload.service");
const { lowercaseEmailMiddleware, verifyToken, authorizeRoles } = require("@middlewares/index.middleware");
const { getAllUsers, getUserDetails, getUserContorller, updateUserData, activeDeacitveUser, updateUserProfile, deleteUserData, deleteUserDataAdmin } = require("./user.controller");

router.get("/", verifyToken, authorizeRoles("admin"), getAllUsers);

router.get("/me", verifyToken, getUserDetails);

router.get("/:userId", verifyToken, authorizeRoles("admin"), getUserContorller);

router.put("/me", verifyToken, updateUserData);

router.patch("/:userId", verifyToken, authorizeRoles("admin"), activeDeacitveUser);

router.patch("/me", verifyToken, upload.single("profileImage"), updateUserProfile);

router.delete("/me", verifyToken, deleteUserData);

router.delete("/:userId", verifyToken, authorizeRoles("admin"), deleteUserDataAdmin);

module.exports = router;