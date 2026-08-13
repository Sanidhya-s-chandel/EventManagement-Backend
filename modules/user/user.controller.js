const response = require("@helpers/response.helper");
const AppError = require("@helpers/AppError.helper");
const catchAsyncError = require("@helpers/catchAsyncError.helper");
const deleteFromCloudinary = require("@utils/cloudinaryDelete.service");
const { User } = require("@models/index.model");
const queryExecutor = require("@utils/queryExecutor.util");

module.exports.getAllUsers = catchAsyncError(async (req, res) => {

    console.log("GET ALL USERS REQUEST");

    const { search, sort } = req.query;

    const queryFilter = {};

    if (search !== undefined) {

        if (typeof search !== "string") {
            throw new AppError("Search parameter must be a string.", 400);
        }

        const trimmedSearch = search.trim();

        if (!trimmedSearch) {
            throw new AppError("Search parameter cannot be empty.", 400);
        }

        if (trimmedSearch.length < 2) {
            throw new AppError("Search must contain at least 2 characters.", 400);
        }

        queryFilter.$text = { $search: trimmedSearch };
    }

    if (sort !== undefined) {

        const allowedSortFields = ["createdAt", "updatedAt", "firstName", "lastName", "email"];

        const sortField = sort.startsWith("-") ? sort.substring(1) : sort;

        if (!allowedSortFields.includes(sortField)) {
            throw new AppError("Invalid sort field.", 400);
        }
    }

    const query = User.find(queryFilter)
        .select("userId firstName lastName email dob gender role otpVerified createdAt updatedAt")
        .sort(sort || "-createdAt")
        .lean();

    const result = await queryExecutor(query, req.query);

    console.log("Result :", result);

    return response.success(res, "Users fetched successfully.", result);
});

module.exports.getUserDetails = catchAsyncError(async (req, res) => {

    console.log("GET USER DETAILS REQUEST");

    const userId = req.user?._id;

    if (!userId) {

        console.log("❌ User ID not found in authenticated request.");
        throw new AppError("Unable to identify the authenticated user.", 401);
    }

    console.log(`Fetching details for user: ${userId}`);

    const user = await User.findById(userId)
        .select("userId firstName lastName email dob gender role isAdmin otpVerified profileImage createdAt updatedAt")
        .lean();

    if (!user) {

        console.log("❌ User account not found.");
        throw new AppError("User account not found.", 404);
    }

    console.log(`✅ User details fetched: ${user.email}`);

    return response.success(res, "User details fetched successfully.", user);
});

module.exports.getUserContorller = catchAsyncError(async (req, res) => {

    console.log("GET USER REQUEST");

    const { userId: requestedUserId } = req.params;

    console.log(`Requested User ID: ${requestedUserId}`);

    if (!requestedUserId?.trim()) {

        console.log("❌ User ID was not provided.");
        throw new AppError("User ID is required.", 400);
    }

    console.log("Searching for user...");

    const user = await User.findOne({ userId: requestedUserId })
        .select("userId firstName lastName email dob gender role isAdmin otpVerified profileImage createdAt updatedAt")
        .lean();

    if (!user) {

        console.log(`❌ User not found with User ID: ${requestedUserId}`);
        throw new AppError("User not found.", 404);
    }

    console.log(`✅ User Found: ${user.email}`);

    return response.success(res, "User details fetched successfully.", user);
});

module.exports.updateUserData = catchAsyncError(async (req, res) => {

    console.log("UPDATE USER DATA REQUEST");

    const userId = req.user?._id;

    if (!userId) {

        console.log("❌ User ID not found in authenticated request.");
        throw new AppError("Unable to identify the authenticated user.", 401);
    }

    console.log(`Updating user: ${userId}`);

    const { firstName, lastName, email, dob, gender } = req.body;

    const updateData = {};

    if (firstName !== undefined) {

        if (typeof firstName !== "string") {
            throw new AppError("First name must be a string.", 400);
        }

        if (!firstName.trim()) {
            throw new AppError("First name cannot be empty.", 400);
        }

        updateData.firstName = firstName.trim();
    }

    if (lastName !== undefined) {

        if (typeof lastName !== "string") {
            throw new AppError("Last name must be a string.", 400);
        }

        if (!lastName.trim()) {
            throw new AppError("Last name cannot be empty.", 400);
        }

        updateData.lastName = lastName.trim();
    }

    if (email !== undefined) {

        if (typeof email !== "string") {
            throw new AppError("Email must be a string.", 400);
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
            throw new AppError("Email cannot be empty.", 400);
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(normalizedEmail)) {
            throw new AppError("Please provide a valid email address.", 400);
        }

        const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: userId } })
            .select("_id")
            .lean();

        if (existingUser) {

            console.log(`❌ Email already belongs to another user: ${normalizedEmail}`);
            throw new AppError("Email address is already in use.", 409);
        }

        // add a workflow afterwards to verify the email using the OTP for the user.

        updateData.email = normalizedEmail;
    }

    if (dob !== undefined) {

        const dateOfBirth = new Date(dob);

        if (isNaN(dateOfBirth.getTime())) {

            console.log("❌ Invalid date of birth.");
            throw new AppError("Invalid date of birth.", 400);
        }

        if (dateOfBirth > new Date()) {

            console.log("❌ Date of birth cannot be in the future.");
            throw new AppError("Date of birth cannot be in the future.", 400);
        }

        updateData.dob = dateOfBirth;
    }

    if (gender !== undefined) {

        const allowedGenders = ["male", "female", "other"];

        if (typeof gender !== "string" || !allowedGenders.includes(gender.toLowerCase())) {

            console.log(`❌ Invalid gender: ${gender}`);
            throw new AppError("Invalid gender.", 400);
        }

        updateData.gender = gender.toLowerCase();
    }

    if (Object.keys(updateData).length === 0) {

        console.log("❌ No valid fields provided for update.");
        throw new AppError("No valid user data was provided for update.", 400);
    }

    console.log("Searching for user...");

    const user = await User.findById(userId);

    if (!user) {

        console.log("❌ User account not found.");
        throw new AppError("User account not found.", 404);
    }

    Object.assign(user, updateData);

    console.log("Saving updated user...");

    await user.save();

    console.log(`✅ User updated successfully: ${user.userId}`);

    const updatedUser = await User.findById(userId)
        .select("userId firstName lastName email dob gender role profileImage createdAt updatedAt")
        .lean();

    return response.success(res, "User details updated successfully.", updatedUser);
});

module.exports.activeDeacitveUser = catchAsyncError(async (req, res) => {

    console.log("ACTIVATE / DEACTIVATE USER REQUEST");

    const { userId: requestedUserId } = req.params;

    console.log(`Requested User ID: ${requestedUserId}`);

    if (!requestedUserId?.trim()) {

        console.log("❌ User ID was not provided.");
        throw new AppError("User ID is required.", 400);
    }

    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {

        console.log("❌ Invalid isActive value.");
        throw new AppError("isActive must be a boolean value.", 400);
    }

    console.log("Searching for user...");

    const user = await User.findOne({ userId: requestedUserId });

    if (!user) {

        console.log(`❌ User not found with User ID: ${requestedUserId}`);
        throw new AppError("User not found.", 404);
    }

    console.log(`✅ User Found: ${user.email}`);

    if (user.isActive === isActive) {

        console.log(`User is already ${isActive ? "active" : "inactive"}.`);
        throw new AppError(`User is already ${isActive ? "active" : "inactive"}.`, 400);
    }

    user.isActive = isActive;

    console.log(`Updating user status to: ${isActive ? "ACTIVE" : "INACTIVE"}`);

    await user.save();

    console.log(`✅ User status updated successfully: ${user.userId}`);

    const updatedUser = await User.findOne({ userId: requestedUserId })
        .select("userId firstName lastName email dob gender role profileImage isActive createdAt updatedAt")
        .lean();

    return response.success(res, `User ${isActive ? "activated" : "deactivated"} successfully.`, updatedUser);
});

module.exports.updateUserProfile = catchAsyncError(async (req, res) => {

    console.log("UPDATE USER PROFILE REQUEST");

    const userId = req.user?._id;

    if (!userId) {

        console.log("❌ User ID not found in authenticated request.");
        throw new AppError("Unable to identify the authenticated user.", 401);
    }

    if (!req.file) {

        console.log("❌ Profile image was not provided.");
        throw new AppError("Please provide a profile image.", 400);
    }

    console.log(`New profile image uploaded: ${req.file.path}`);

    console.log("Searching for user...");

    const user = await User.findById(userId);

    if (!user) {

        console.log("❌ User account not found.");
        throw new AppError("User account not found.", 404);
    }

    console.log(`✅ User Found: ${user.email}`);

    if (user.profileImage) {

        console.log("Deleting old profile image from Cloudinary...");
        await deleteFromCloudinary(user.profileImage);
    }

    user.profileImage = req.file.path;

    console.log("Saving updated profile image...");

    await user.save();

    console.log(`✅ Profile image updated successfully: ${user.userId}`);

    const updatedUser = await User.findById(userId)
        .select("userId firstName lastName email dob gender role profileImage createdAt updatedAt")
        .lean();

    return response.success(res, "Profile image updated successfully.", updatedUser);
});

module.exports.deleteUserData = catchAsyncError(async (req, res) => {

    console.log("DELETE MY ACCOUNT REQUEST");

    const userId = req.user?._id;

    if (!userId) {

        console.log("❌ User ID not found in authenticated request.");
        throw new AppError("Unable to identify the authenticated user.", 401);
    }

    console.log(`Requested account deletion for user: ${userId}`);

    console.log("Searching for user...");

    const user = await User.findById(userId);

    if (!user) {

        console.log("❌ User account not found.");
        throw new AppError("User account not found.", 404);
    }

    console.log(`✅ User Found: ${user.email}`);

    if (!user.isActive) {

        console.log("❌ User account is already inactive.");

        throw new AppError("User account is already inactive.", 400);
    }

    user.isActive = false;

    // Optional if you add this field to your model later
    // user.deletedAt = new Date();

    console.log("Deactivating user account...");

    await user.save();

    console.log(`✅ User account deactivated successfully: ${user.userId}`);

    // uncomment when the user has a flow to permament delete the accound.

    // if (user.profileImage) {

    //     console.log("Deleting user's profile image from Cloudinary...");
    //     await deleteFromCloudinary(user.profileImage);
    // }

    console.log("✅ Account deletion process completed.");

    return response.success(res, "User account deleted successfully.");
});

module.exports.deleteUserDataAdmin = catchAsyncError(async (req, res) => {

    console.log("ADMIN DELETE USER REQUEST");

    const { userId: requestedUserId } = req.params;

    console.log(`Requested User ID: ${requestedUserId}`);

    if (!requestedUserId?.trim()) {

        console.log("❌ User ID was not provided.");
        throw new AppError("User ID is required.", 400);
    }

    if (req.user?._id && req.user._id.toString() === requestedUserId) {

        console.log("❌ Admin attempted to delete their own account.");
        throw new AppError("You cannot delete your own account using the admin delete endpoint.", 400);
    }

    console.log("Searching for user...");

    const user = await User.findOne({ userId: requestedUserId });

    if (!user) {

        console.log(`❌ User not found with User ID: ${requestedUserId}`);
        throw new AppError("User not found.", 404);
    }

    console.log(`✅ User Found: ${user.email}`);

    if (!user.isActive) {

        console.log("❌ User account is already inactive.");
        throw new AppError("User account is already inactive.", 400);
    }

    user.isActive = false;

    console.log("Deactivating user account...");

    await user.save();

    console.log(`✅ User account deactivated: ${user.userId}`);

    if (user.profileImage) {

        console.log("Deleting user's profile image from Cloudinary...");
        await deleteFromCloudinary(user.profileImage);
    }

    console.log(`✅ Admin successfully deactivated user: ${user.userId}`);

    return response.success(res, "User account deactivated successfully.");
});