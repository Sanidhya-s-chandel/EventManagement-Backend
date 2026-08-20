const mongoose = require("mongoose");
const response = require("@helpers/response.helper");
const AppError = require("@helpers/AppError.helper");
const catchAsyncError = require("@helpers/catchAsyncError.helper");
const { generateSeatLayout } = require("@helpers/generateSeatLayout.helper")
const { generateEventId, generateBookingId } = require("@helpers/customIdGenerator.helper");
const { Event, Category, User, Booking } = require("@models/index.model");
const queryExecutor = require("@utils/queryExecutor.util");
const deleteFromCloudinary = require("@utils/cloudinaryDelete.service");

module.exports.getAllBookingsController = catchAsyncError(async (req, res) => {

    console.log("GET ALL BOOKINGS API HAS BEEN CALLED");

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (page < 1) {
        console.log("❌ Invalid page number.");
        throw new AppError("Page number must be greater than 0", 400);
    }

    if (limit < 1 || limit > 100) {
        console.log("❌ Invalid limit value.");
        throw new AppError("Limit must be between 1 and 100", 400);
    }

    const skip = (page - 1) * limit;

    console.log(`Pagination -> Page: ${page}, Limit: ${limit}, Skip: ${skip}`);

    const { bookingStatus, paymentStatus } = req.query;

    const filter = {};

    const allowedBookingStatuses = ["pending", "confirmed", "cancelled", "expired"];

    if (bookingStatus) {

        if (!allowedBookingStatuses.includes(bookingStatus)) {

            console.log(`❌ Invalid booking status: ${bookingStatus}`);

            throw new AppError(`Invalid booking status. Allowed values: ${allowedBookingStatuses.join(", ")}`, 400);
        }

        filter.bookingStatus = bookingStatus;

        console.log(`Booking Status Filter: ${bookingStatus}`);
    }

    const allowedPaymentStatuses = ["pending", "completed", "failed"];

    if (paymentStatus) {

        if (!allowedPaymentStatuses.includes(paymentStatus)) {

            console.log(`❌ Invalid payment status: ${paymentStatus}`);

            throw new AppError(`Invalid payment status. Allowed values: ${allowedPaymentStatuses.join(", ")}`, 400
            );
        }

        filter.paymentStatus = paymentStatus;

        console.log(`Payment Status Filter: ${paymentStatus}`);
    }


    console.log("Final Booking Filter:", filter);

    console.log("Fetching bookings from database...");

    const [bookings, totalBookings] = await Promise.all([

        Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
            .populate("user", "userId firstName lastName email profileImage")
            .populate("event", "eventId title date location").lean(),

        Booking.countDocuments(filter)
    ]);


    console.log(`✅ Bookings fetched successfully: ${bookings.length}`);

    const totalPages = Math.ceil(totalBookings / limit);

    console.log(`Total Bookings: ${totalBookings}, Total Pages: ${totalPages}`);

    return response.success(res, "Bookings fetched successfully", {
        bookings,
        pagination: {
            currentPage: page,
            limit,
            totalBookings,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
        }
    });
});

module.exports.getMyBookingsController = catchAsyncError(async (req, res) => {

    console.log("GET MY BOOKINGS API HAS BEEN CALLED");

    const userId = req.user?._id;

    if (!userId) {
        console.log("❌ User information not found in request.");
        throw new AppError("Unable to identify the authenticated user.", 401);
    }

    console.log(`Fetching bookings for user: ${userId}`);

    const page = req.query.page ? Number(req.query.page) : 1;

    const limit = req.query.limit ? Number(req.query.limit) : 10;

    if (!Number.isInteger(page) || page < 1) {
        console.log("❌ Invalid page number.");
        throw new AppError("Page must be a positive integer", 400);
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        console.log("❌ Invalid limit value.");
        throw new AppError("Limit must be an integer between 1 and 100", 400);
    }

    const skip = (page - 1) * limit;

    console.log(`Pagination -> Page: ${page}, Limit: ${limit}, Skip: ${skip}`);

    console.log("Searching for user bookings...");

    const [bookings, totalBookings] = await Promise.all([

        Booking.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit)
            .populate("event", "eventId title date time location bannerImage")
            .lean(),

        Booking.countDocuments({ user: userId })
    ]);

    console.log(`✅ User bookings fetched successfully: ${bookings.length}`);

    const totalPages = Math.ceil(totalBookings / limit);

    console.log(`Total Bookings: ${totalBookings}, Total Pages: ${totalPages}`);

    return response.success(res, "Your bookings fetched successfully", {
        bookings,
        pagination: {
            currentPage: page,
            limit,
            totalBookings,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
        }
    });
});

module.exports.getBookingController = catchAsyncError(async (req, res) => {

    console.log("GET BOOKING API HAS BEEN CALLED");

    const userId = req.user?._id;
    const userRole = req.user?.role;

    if (!userId) {
        console.log("❌ User information not found in request.");
        throw new AppError("Unable to identify the authenticated user.", 401);
    }

    console.log(`Authenticated User: ${userId}`);
    console.log(`User Role: ${userRole}`);

    const { bookingId: requestedBookingId } = req.params;

    if (!requestedBookingId?.trim()) {

        console.log("❌ Booking ID was not provided.");
        throw new AppError("Booking ID is required", 400);
    }

    console.log(`Requested Booking ID: ${requestedBookingId}`);

    const query = { bookingId: requestedBookingId };

    if (userRole !== "admin" && userRole !== "dev") {
        query.user = userId;
        console.log("Ownership check enabled for normal user.");
    }

    console.log("Searching for booking...");

    const booking = await Booking.findOne(query)
        .populate("user", "userId firstName lastName email profileImage")
        .populate("event", "eventId title description category location date time bannerImage")
        .lean();

    if (!booking) {
        console.log(`❌ Booking not found: ${requestedBookingId}`);
        throw new AppError("Booking not found", 404);
    }

    console.log(`✅ Booking found: ${booking.bookingId}`);

    return response.success(res, "Booking fetched successfully", booking);
});

module.exports.createBookingController = catchAsyncError(async (req, res) => {

    console.log("CREATE BOOKING API HAS BEEN CALLED");

    const session = await mongoose.startSession();

    try {
        const userId = req.user?._id;

        if (!userId) {

            console.log("❌ User information not found.");
            throw new AppError("Unable to identify the authenticated user.", 401);
        }

        console.log(`Authenticated User: ${userId}`);

        const { eventId, seats } = req.body;

        if (!eventId?.trim()) {

            console.log("❌ Event ID was not provided.");
            throw new AppError("Event ID is required", 400);
        }

        if (!Array.isArray(seats) || seats.length === 0) {

            console.log("❌ No seats were provided.");
            throw new AppError("Please select at least one seat", 400);
        }

        console.log(`Requested Event ID: ${eventId}`);
        console.log(`Requested Seats: ${seats.length}`);

        const requestedSeatNumbers = seats.map(seat => seat?.seatNumber?.trim());

        if (requestedSeatNumbers.some(seat => !seat)) {

            console.log("❌ Invalid seat information.");
            throw new AppError("Each selected seat must have a valid seat number", 400);
        }

        const uniqueSeats = new Set(requestedSeatNumbers);

        if (uniqueSeats.size !== requestedSeatNumbers.length) {

            console.log("❌ Duplicate seats found.");
            throw new AppError("Duplicate seats cannot be booked", 400);
        }

        console.log("Starting MongoDB transaction...");

        await session.startTransaction();

        console.log("Searching for event...");

        const event = await Event.findOne({ eventId })
            .select("eventId title date time seatLayout availableSeats totalSeats isPaid price")
            .session(session);

        if (!event) {

            console.log(`❌ Event not found: ${eventId}`);
            throw new AppError("Event not found", 404);
        }

        console.log(`✅ Event found: ${event.title}`);

        if (new Date(event.date) < new Date()) {

            console.log("❌ Cannot book an event that has already started.");
            throw new AppError("This event is no longer available for booking", 400);
        }

        if (event.availableSeats < seats.length) {

            console.log(`❌ Not enough seats available. Requested: ${seats.length}, Available: ${event.availableSeats}`);
            throw new AppError("Not enough seats are available", 400);
        }

        const selectedSeats = [];

        for (const requestedSeatNumber of requestedSeatNumbers) {

            const seat = event.seatLayout.find(eventSeat => eventSeat.seatNumber === requestedSeatNumber);

            if (!seat) {

                console.log(`❌ Seat not found: ${requestedSeatNumber}`);
                throw new AppError(`Seat ${requestedSeatNumber} does not exist`, 400);
            }

            if (seat.isBooked) {

                console.log(`❌ Seat already booked: ${requestedSeatNumber}`);
                throw new AppError(`Seat ${requestedSeatNumber} is already booked`, 409);
            }

            selectedSeats.push({
                seatNumber: seat.seatNumber,
                row: seat.row,
                price: seat.price
            });
        }


        console.log(`✅ ${selectedSeats.length} seats validated successfully.`);

        const totalAmount = selectedSeats.reduce((total, seat) => total + seat.price, 0);

        console.log(`Total Booking Amount: ${totalAmount}`);

        const bookingId = await generateBookingId();

        console.log(`Generated Booking ID: ${bookingId}`);

        for (const requestedSeatNumber of requestedSeatNumbers) {

            const seatIndex = event.seatLayout.findIndex(eventSeat => eventSeat.seatNumber === requestedSeatNumber);
            event.seatLayout[seatIndex].isBooked = true;
        }

        event.availableSeats -= selectedSeats.length;

        await event.save({ session });

        console.log(`✅ ${selectedSeats.length} seats reserved successfully.`);

        const booking = new Booking({
            bookingId,
            user: userId,
            event: event._id,
            seats: selectedSeats,
            totalAmount,
            paymentStatus: "pending",
            bookingStatus: "pending"
        });

        await booking.save({ session });

        console.log(`✅ Booking created: ${bookingId}`);

        await session.commitTransaction();

        console.log(`✅ Booking transaction committed successfully: ${bookingId}`);

        return response.created(res, "Booking created successfully. Proceed with payment.", booking);

    } catch (error) {

        console.log("❌ Booking transaction failed.");

        await session.abortTransaction();

        console.log("↩️ Booking transaction rolled back.");
        throw error;

    } finally {
        await session.endSession();
        console.log("MongoDB booking session ended.");
    }
});

module.exports.cancelBookingController = catchAsyncError(async (req, res) => {

    console.log("CANCEL BOOKING API HAS BEEN CALLED");

    const session = await mongoose.startSession();

    try {

        const userId = req.user?._id;
        const userRole = req.user?.role;

        if (!userId) {
            console.log("❌ User information not found.");
            throw new AppError("Unable to identify the authenticated user.", 401);
        }

        console.log(`Authenticated User: ${userId}`);
        console.log(`User Role: ${userRole}`);

        const { bookingId: requestedBookingId } = req.params;

        if (!requestedBookingId?.trim()) {
            console.log("❌ Booking ID was not provided.");
            throw new AppError("Booking ID is required", 400);
        }

        console.log(`Requested Booking ID: ${requestedBookingId}`);

        console.log("Starting MongoDB transaction...");

        session.startTransaction();

        console.log("Searching for booking...");

        const booking = await Booking.findOne({ bookingId: requestedBookingId }).session(session);

        if (!booking) {
            console.log(`❌ Booking not found: ${requestedBookingId}`);
            throw new AppError("Booking not found", 404);
        }

        console.log(    `✅ Booking found: ${booking.bookingId}`    );

        const isAdminOrDev = userRole === "admin" || userRole === "dev";

        if (!isAdminOrDev && booking.user.toString() !== userId.toString()) {
            console.log("❌ User attempted to cancel another user's booking.");
            throw new AppError("You are not authorized to cancel this booking", 403);
        }

        if (booking.bookingStatus === "cancelled") {
            console.log("❌ Booking has already been cancelled.");
            throw new AppError("This booking has already been cancelled", 400);
        }

        if (booking.bookingStatus !== "confirmed") {
            console.log(`❌ Booking cannot be cancelled. Current status: ${booking.bookingStatus}`);
            throw new AppError("Only confirmed bookings can be cancelled", 400);
        }

        console.log("Searching for associated event...");

        const event = await Event.findById(booking.event)
            .select("eventId title date seatLayout availableSeats totalSeats")
            .session(session);

        if (!event) {

            console.log(`❌ Associated event not found: ${booking.event}`);
            throw new AppError("Associated event not found", 404);
        }

        console.log(`✅ Event found: ${event.title}`);

        if (new Date(event.date) < new Date()) {

            console.log("❌ Event has already started.");
            throw new AppError("Booking cannot be cancelled after the event has started", 400);
        }

        console.log(`Releasing ${booking.seats.length} booked seats...`);

        let releasedSeats = 0;

        for (const bookedSeat of booking.seats) {

            const seatIndex = event.seatLayout.findIndex(eventSeat => eventSeat.seatNumber === bookedSeat.seatNumber);

            if (seatIndex === -1) {

                console.log(`❌ Seat not found in event layout: ${bookedSeat.seatNumber}`);
                throw new AppError(`Seat ${bookedSeat.seatNumber} was not found in the event layout`, 400);
            }


            if (!event.seatLayout[seatIndex].isBooked) {

                console.log(`⚠️ Seat ${bookedSeat.seatNumber} is already available.`);
                continue;
            }

            event.seatLayout[seatIndex].isBooked = false;
            releasedSeats++;
        }

        console.log(`✅ ${releasedSeats} seats released successfully.`);

        event.availableSeats += releasedSeats;

        await event.save({ session });
        console.log(`Available seats updated: ${event.availableSeats}`);

        booking.bookingStatus = "cancelled";

        await booking.save({ session });

        console.log(`✅ Booking marked as cancelled: ${booking.bookingId}`);
        await session.commitTransaction();
        console.log(`✅ Cancellation transaction committed successfully: ${booking.bookingId}`);

        return response.success(res, "Booking cancelled successfully", booking);

    } catch (error) {

        console.log("❌ Booking cancellation transaction failed.");

        await session.abortTransaction();
        console.log("↩️ Booking cancellation transaction rolled back.");
        throw error;

    } finally {
        await session.endSession();
        console.log("MongoDB cancellation session ended.");
    }
});