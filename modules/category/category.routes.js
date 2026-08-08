const express = require("express");
const router = express.Router();
const upload = require("@utils/upload.service");
const { lowercaseEmailMiddleware, verifyToken, authorizeRoles } = require("@middlewares/index.middleware");
const { createCategoryController, updateCategory, getAllCategoriesController, deleteCategoryController } = require("./category.controller");

router.get("/", verifyToken, getAllCategoriesController);

router.post("/create", verifyToken, authorizeRoles("admin"), upload.single("icons"), createCategoryController);

router.put("/:id", verifyToken, authorizeRoles("admin"), upload.single("icons"), updateCategory);

router.delete("/:id", verifyToken, authorizeRoles("admin"), deleteCategoryController);

module.exports = router;