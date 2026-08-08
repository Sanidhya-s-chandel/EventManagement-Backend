const response = require("@helpers/response.helper");
const AppError = require("@helpers/AppError.helper");
const catchAsyncError = require("@helpers/catchAsyncError.helper");
const { Category } = require("@models/index.model");
const deleteFromCloudinary = require("@utils/cloudinaryDelete.service");

module.exports.createCategoryController = catchAsyncError(async (req, res) => {
    console.log("CREATE CATEGORY REQUEST");

    const { name, description } = req.body;

    if (!name?.trim()) {

        console.log("Category name is missing.");
        throw new AppError("Category name is required", 400);
    }

    const normalizedName = name.trim();

    console.log(`Checking category existence for: ${normalizedName}`);

    const existingCategory = await Category.findOne({ name: { $regex: `^${normalizedName}$`, $options: "i" } }).lean();

    if (existingCategory) {
        console.log(` Category already exists: ${normalizedName}`);
        throw new AppError("Category already exists", 409);
    }

    const icon = req.file?.path || "";

    console.log(`Category Icon: ${icon ? "Uploaded Successfully" : "No Icon Provided"}`);

    console.log("Creating Category Document...");

    const categoryObj = new Category({
        name: normalizedName,
        description: description?.trim() || "",
        icon
    });

    await categoryObj.save();

    console.log(`Category Created Successfully`);

    console.log(`Category Id: ${categoryObj._id}`);

    return response.created(res, "Category created successfully", categoryObj
    );
});

module.exports.updateCategory = catchAsyncError(async (req, res) => {

    console.log("UPDATE CATEGORY REQUEST");

    const { categoryId } = req.params;

    const { name, description } = req.body;

    console.log("Category ID:", categoryId);
    console.log("Request Body:", req.body);

    if (!categoryId) {

        console.log("Category ID is required.");
        throw new AppError("Category ID is required", 400);
    }

    console.log("Checking category existence...");

    const category = await Category.findById(categoryId);

    if (!category) {

        console.log(`Category not found: ${categoryId}`);
        throw new AppError("Category not found", 404);
    }

    if (name && name.trim() !== category.name) {

        console.log(`Checking duplicate category for: ${name}`);

        const existingCategory = await Category.findOne({
            _id: { $ne: categoryId },
            name: {
                $regex: `^${name.trim()}$`,
                $options: "i"
            }
        }).lean();

        if (existingCategory) {

            console.log(` Category already exists: ${name}`);
            throw new AppError("Category with this name already exists", 409);
        }

        category.name = name.trim();
    }


    if (description !== undefined) {
        category.description = description.trim();
    }

    if (req.file?.path) {

        console.log("Updating category icon...");
        category.icon = req.file.path;
    }

    console.log("Saving updated category...");
    await category.save();

    console.log(` Category updated successfully`);
    return response.success(res, "Category updated successfully", category);
});

module.exports.getAllCategoriesController = catchAsyncError(async (req, res) => {
    console.log("GET ALL CATEGORIES REQUEST");

    let { page = 1, limit = 10, search = "" } = req.query;

    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    limit = Math.min(limit, 100);

    console.log("Query Params:", { page, limit, search });

    const filter = {};
    if (search?.trim()) {
        const normalizedSearch = search.trim();
        console.log(`Applying name search filter for: ${normalizedSearch}`);
        filter.name = { $regex: normalizedSearch, $options: "i" };
    }

    console.log("Counting matching categories...");
    const total = await Category.countDocuments(filter);

    const totalPages = total > 0 ? Math.ceil(total / limit) : 1;
    const skip = (page - 1) * limit;

    console.log(`Fetching categories page ${page} (skip: ${skip}, limit: ${limit})`);
    const categories = await Category.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

    console.log(`Fetched ${categories.length} categories out of ${total}`);

    const meta = {
        total,
        page,
        limit,
        totalPages
    };

    return response.success(res, "Categories fetched successfully", { categories, meta });
});

module.exports.deleteCategoryController = catchAsyncError(async (req, res) => {

    console.log(" DELETE CATEGORY REQUEST");
    const { categoryId } = req.params;

    console.log("Category ID:", categoryId);

    if (!categoryId) {
        console.log(" Category ID is required.");
        throw new AppError("Category ID is required", 400);
    }

    console.log("Fetching category...");
    const category = await Category.findById(categoryId);

    if (!category) {
        console.log(`Category not found: ${categoryId}`);
        throw new AppError("Category not found", 404);
    }

    console.log("Checking linked events...");
    const linkedEvents = await Event.countDocuments({ category: categoryId });

    if (linkedEvents > 0) {
        console.log(` Cannot delete category. ${linkedEvents} event(s) are using it.`);
        throw new AppError("Cannot delete category because events are associated with it.", 409);
    }

    if (category.icon) {
        console.log("Deleting category icon from Cloudinary...");
        await deleteFromCloudinary(category.icon);
    }

    console.log("Deleting category document...");
    await category.deleteOne();

    console.log(` Category deleted successfully: ${categoryId}`);
    return response.success(res, "Category deleted successfully", { categoryId });
});