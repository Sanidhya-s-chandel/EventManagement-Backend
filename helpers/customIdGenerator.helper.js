const { User } = require("@models/index.model");
const AppError = require("@helpers/AppError.helper");
const catchAsyncError = require("@helpers/catchAsyncError.helper");


// Custom ID generator function for users

const generateUserId = async () => {
    console.log("Finding last registered user...");

    const lastUser = await User.findOne()
        .sort({ createdAt: -1 })
        .select("userId")
        .lean();

    if (!lastUser || !lastUser.userId) {
        console.log("No user found. Using default ID.");
        return "USR-1000";
    }

    console.log("Last userId found:", lastUser.userId);

    const lastIdNumber = parseInt(lastUser.userId.split("-")[1], 10);
    const newUserId = `USR-${lastIdNumber + 1}`;

    console.log(`Generated User ID: ${newUserId}`);

    return newUserId;
};

module.exports = { generateUserId };