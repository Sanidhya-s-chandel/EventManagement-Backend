const { User, Event, Booking } = require("@models/index.model");
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

const generateEventId = async (category) => {

    console.log(`Generating Event ID for category: ${category}`);

    const categoryPrefix = {
        music: "MUS",
        workshop: "WRK",
        sports: "SPT",
        technology: "TEC",
        comedy: "COM",
        business: "BUS",
        education: "EDU",
        festival: "FES",
        gaming: "GAM"
    };

    const prefix = categoryPrefix[category.toLowerCase()] || "EVT";

    console.log(`Using prefix: ${prefix}`);

    const lastEvent = await Event.findOne({ eventId: { $regex: `^${prefix}-\\d+$` } })
        .sort({ createdAt: -1 })
        .select("eventId")
        .lean();

    if (!lastEvent || !lastEvent.eventId) {

        console.log(`No existing ${category} events found. Starting from ${prefix}-1000`);
        return `${prefix}-1000`;
    }

    console.log(`Last Event Found: ${lastEvent.eventId}`);

    const lastNumber = parseInt(lastEvent.eventId.split("-")[1], 10);

    const newEventId = `${prefix}-${lastNumber + 1}`;

    console.log(`Generated Event ID: ${newEventId}`);

    return newEventId;
};

const generateBookingId = async () => {

    try {
        const lastBooking = await Booking.findOne({}).sort({ createdAt: -1 }).select("bookingId").lean();
        console.log("Last Booking Found:", lastBooking?.bookingId || "None");

        let nextNumber = 1;

        if (lastBooking?.bookingId) {

            const numericPart = parseInt(lastBooking.bookingId.replace("BKG-", ""), 10);

            if (!isNaN(numericPart)) {
                nextNumber = numericPart + 1;
            }
        }

        console.log(`Next Booking Number: ${nextNumber}`);
        return `BKG-${String(nextNumber).padStart(6, "0")}`;
    } catch (error) {

        console.error("❌ Failed to generate Booking ID:", error.message);
        console.error(error.stack);
        throw error;
    }
};

module.exports = { generateUserId, generateEventId, generateBookingId };