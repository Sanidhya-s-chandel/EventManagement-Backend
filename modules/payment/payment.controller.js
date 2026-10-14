const mongoose = require("mongoose");
const response = require("@helpers/response.helper");
const AppError = require("@helpers/AppError.helper");
const catchAsyncError = require("@helpers/catchAsyncError.helper");
const { generatePaymentId } = require("@helpers/customIdGenerator.helper");
const { Booking, Payment } = require("@models/index.model");

module.exports.getPaymentController = catchAsyncError(async (req, res) => {

    console.log("GET ALL PAYMENTS API HAS BEEN CALLED");

    const userId = req.user?._id;

    if (!userId) {
        console.log("❌ User information not found.");
        throw new AppError("Unable to identify the authenticated user.", 401);
    }

    console.log(`Authenticated User: ${userId}`);

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

    const query = {};

    if (req.query.status) {

        const allowedStatuses = ["pending", "completed", "failed", "refunded"];

        if (!allowedStatuses.includes(req.query.status)) {

            console.log(`❌ Invalid payment status: ${req.query.status}`);
            throw new AppError("Invalid payment status", 400);
        }

        query.status = req.query.status;
        console.log(`Filtering payments by status: ${req.query.status}`);
    }

    if (req.query.provider) {
        query.provider = req.query.provider.trim();
    }

    if (req.query.userId) {

        const requestedUserId = req.query.userId.trim();

        if (!mongoose.Types.ObjectId.isValid(requestedUserId)) {
            console.log(`❌ Invalid User ID: ${requestedUserId}`);
            throw new AppError("Invalid user ID", 400);
        }

        query.user = requestedUserId;
        console.log(`Filtering payments by user ID: ${requestedUserId}`);
    };

    console.log("Searching for payments...");

    const [payments, totalPayments] = await Promise.all([
        Payment.find(query)
            .select("paymentId booking user amount currency provider transactionId status paymentMethod paidAt createdAt")
            .populate("user", "userId firstName lastName email")
            .populate("booking", "bookingId totalAmount bookingStatus paymentStatus seats").sort({ createdAt: -1 }).skip(skip).limit(limit)
            .lean(),

        Payment.countDocuments(query)

    ]);


    console.log(`✅ Payments fetched successfully: ${payments.length}`);

    const totalPages = Math.ceil(totalPayments / limit);

    console.log(`Total Payments: ${totalPayments}, Total Pages: ${totalPages}`);

    return response.success(res, "Payments fetched successfully",
        {
            payments,
            pagination: {
                currentPage: page,
                limit,
                totalPayments,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        }
    );
});

module.exports.getMyPaymentsController = catchAsyncError(async (req, res) => {

    console.log("GET MY PAYMENTS API HAS BEEN CALLED");

    const userId = req.user?._id;

    if (!userId) {
        console.log("❌ User information not found.");
        throw new AppError("Unable to identify the authenticated user.", 401);
    }

    console.log(`Fetching payments for user: ${userId}`);

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

    const query = { user: userId };

    if (req.query.status) {

        const allowedStatuses = ["pending", "completed", "failed", "refunded"];

        const requestedStatus = req.query.status.trim();

        if (!allowedStatuses.includes(requestedStatus)) {

            console.log(`❌ Invalid payment status: ${requestedStatus}`);
            throw new AppError("Invalid payment status", 400);
        }

        query.status = requestedStatus;

        console.log(`Payment status filter applied: ${requestedStatus}`);
    }

    console.log("Searching for user payments...");

    const [payments, totalPayments] = await Promise.all([

        Payment.find(query).select("booking amount paymentMethod provider currency transactionId status createdAt updatedAt")
            .populate("booking", "bookingId totalAmount bookingStatus seats").sort({ createdAt: -1 }).skip(skip).limit(limit)
            .lean(),

        Payment.countDocuments(query)
    ]);

    console.log(`✅ Payments fetched successfully: ${payments.length}`);

    const totalPages = Math.ceil(totalPayments / limit);

    console.log(`Total Payments: ${totalPayments}, Total Pages: ${totalPages}`);

    return response.success(res, "Your payments fetched successfully",
        {
            payments,
            pagination: {
                currentPage: page,
                limit,
                totalPayments,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        }
    );
});

module.exports.getPaymentByIdController = catchAsyncError(async (req, res) => {

    console.log("GET PAYMENT BY ID API HAS BEEN CALLED");

    const userId = req.user?._id;
    const userRole = req.user?.role;

    if (!userId) {
        console.log("❌ User information not found.");
        throw new AppError("Unable to identify the authenticated user.", 401);
    }

    console.log(`Authenticated User: ${userId}`);
    console.log(`User Role: ${userRole}`);

    const { paymentId: requestedPaymentId } = req.params;

    if (!requestedPaymentId?.trim()) {
        console.log("❌ Payment ID was not provided.");
        throw new AppError("Payment ID is required", 400);
    }

    console.log(`Requested Payment ID: ${requestedPaymentId}`);

    const query = { paymentId: requestedPaymentId };

    if (userRole !== "admin" && userRole !== "dev") {
        query.user = userId;
        console.log("Ownership check enabled for normal user.");
    }

    console.log("Searching for payment...");

    const payment = await Payment.findOne(query)
        .select("paymentId booking user amount paymentMethod provider currency transactionId status createdAt updatedAt")
        .populate("booking", "bookingId event seats totalAmount bookingStatus paymentStatus bookedAt")
        .populate("user", "userId firstName lastName email")
        .lean();

    if (!payment) {
        console.log(`❌ Payment not found: ${requestedPaymentId}`);
        throw new AppError("Payment not found", 404);
    }

    console.log(`✅ Payment found: ${payment.paymentId}`);

    return response.success(res, "Payment fetched successfully", payment);
});

module.exports.createPaymentController = catchAsyncError(async (req, res) => {
    console.log("CREATE PAYMENT API HAS BEEN CALLED");

    const userId = req.user?._id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return next(new AppError("Invalid user authentication", 401));
    }

    const { bookingId, paymentMethod, provider } = req.body;

    if (!bookingId || typeof bookingId !== "string") {
        return next(new AppError("Booking ID is required", 400));
    }

    const allowedPaymentMethods = ["card", "upi", "netbanking", "cash",];

    const allowedProviders = ["razorpay", "stripe", "paypal", "others"];

    if (!allowedPaymentMethods.includes(paymentMethod)) {
        return next(new AppError("Invalid payment method", 400));
    }

    if (!allowedProviders.includes(provider)) {
        return next(new AppError("Invalid payment provider", 400));
    }

    const booking = await Booking.findOne({
        bookingId: bookingId.trim(),
        user: userId,
    });

    if (!booking) {
        return next(new AppError("Booking not found or you do not have access to it", 404));
    }

    console.log(`Booking found: ${booking.bookingId}`);

    if (["cancelled", "expired"].includes(booking.bookingStatus)) {
        return next(new AppError("Payment cannot be initiated for this booking", 400));
    }

    if (booking.paymentStatus === "completed") {
        return next(new AppError("This booking has already been paid for", 409));
    }

    const existingPayment = await Payment.findOne({
        booking: booking._id,
        user: userId,
        status: { $in: ["pending", "completed"] },
    });

    if (existingPayment?.status === "completed") {
        return next(new AppError("Payment has already been completed for this booking", 409));
    }

    if (existingPayment?.status === "pending") {
        return next(
            new AppError("A payment is already pending for this booking", 409)
        );
    }

    const amount = booking.totalAmount;

    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
        return next(new AppError("Invalid booking amount", 400));
    }

    const paymentId = await generatePaymentId();

    const payment = await Payment.create({
        paymentId,
        booking: booking._id,
        user: userId,
        amount,
        paymentMethod,
        provider,
        currency: "INR",
        status: "pending",
    });

    console.log(`Payment created successfully: ${payment.paymentId}`);

    return response.success(res, "Payment initiated successfully", {
        payment: {
            paymentId: payment.paymentId,
            bookingId: booking.bookingId,
            amount: payment.amount,
            currency: payment.currency,
            paymentMethod: payment.paymentMethod,
            provider: payment.provider,
            status: payment.status,
            createdAt: payment.createdAt,
        },
    });
});

module.exports.verifyPaymentController = catchAsyncError(async (req, res) => {
    console.log("VERIFY PAYMENT API HAS BEEN CALLED");

    const { status, paymentId } = req.body;

    if (!paymentId || typeof paymentId !== "string") {
        return next(new AppError("Valid payment ID is required", 400));
    }

    if (!["completed", "failed"].includes(status)) {
        return next(
            new AppError("Status must be either completed or failed", 400)
        );
    }

    const session = await mongoose.startSession();

    try {
        let updatedPayment;
        let updatedBooking;

        await session.withTransaction(async () => {

            const payment = await Payment.findOne({ paymentId: paymentId.trim() }).session(session);

            if (!payment) {
                throw new AppError("Payment not found", 404);
            }

            if (payment.provider !== "others") {
                throw new AppError("This payment requires verification through its payment provider", 400);
            }

            if (payment.status !== "pending") {
                throw new AppError(`Payment cannot be verified because its status is ${payment.status}`, 409);
            }

            const booking = await Booking.findById(payment.booking).session(session);

            if (!booking) {
                throw new AppError("Associated booking not found", 404);
            }

            if (["cancelled", "expired"].includes(booking.bookingStatus)) {
                throw new AppError("Cannot verify payment for a cancelled or expired booking", 409);
            }

            updatedPayment = await Payment.findOneAndUpdate(
                {
                    _id: payment._id,
                    status: "pending",
                    provider: "others",
                },
                {
                    $set: { status },
                },
                {
                    new: true,
                    runValidators: true,
                    session,
                }
            );

            if (!updatedPayment) {
                throw new AppError("Payment is no longer pending or has already been verified", 409);
            }

            const bookingUpdate = {
                paymentStatus: status,
            };

            if (status === "completed") {
                bookingUpdate.bookingStatus = "confirmed";
            }

            const bookingResult = await Booking.updateOne(
                {
                    _id: booking._id,
                    bookingStatus: {
                        $nin: ["cancelled", "expired"],
                    },
                },
                {
                    $set: bookingUpdate,
                },
                {
                    runValidators: true,
                    session,
                }
            );

            if (bookingResult.matchedCount !== 1) {
                throw new AppError("Booking status changed or is no longer eligible for verification", 409);
            }

            updatedBooking = {
                bookingId: booking.bookingId,
                paymentStatus: status,
                bookingStatus: status === "completed" ? "confirmed" : booking.bookingStatus,
            };
        });

        console.log(`Payment ${updatedPayment.paymentId} verified successfully: ${status}`);

        return response.success(res, `Payment ${status === "completed" ? "approved" : "rejected"} successfully`,
            {
                payment: {
                    paymentId: updatedPayment.paymentId,
                    status: updatedPayment.status,
                    amount: updatedPayment.amount,
                    currency: updatedPayment.currency,
                },
                booking: updatedBooking,
            }
        );
    } finally {
        await session.endSession();
    }
});

module.exports.refundPaymentController = catchAsyncError(async (req, res, next) => {
    console.log("REFUND PAYMENT API HAS BEEN CALLED");

    const { paymentId } = req.params;

    if (!paymentId || typeof paymentId !== "string") {
        return next(new AppError("Valid payment ID is required", 400));
    }

    const session = await mongoose.startSession();

    try {
        let updatedPayment;
        let updatedBooking;

        await session.withTransaction(async () => {
            const payment = await Payment.findOne({ paymentId: paymentId.trim(), }).session(session);

            if (!payment) {
                throw new AppError("Payment not found", 404);
            }

            if (payment.status !== "completed") {
                throw new AppError("Only completed payments can be refunded", 409);
            }

            if (payment.provider !== "others") {
                throw new AppError("This payment requires a refund through its payment provider", 400);
            }

            const booking = await Booking.findById(payment.booking).session(session);

            if (!booking) {
                throw new AppError("Associated booking not found", 404);
            }

            if (booking.bookingStatus !== "cancelled") {
                throw new AppError("Only payments associated with cancelled bookings can be refunded", 409);
            }

            if (booking.paymentStatus !== "completed") {
                throw new AppError("Booking payment status does not allow a refund", 409);
            }

            updatedPayment = await Payment.findOneAndUpdate(
                {
                    _id: payment._id,
                    status: "completed",
                    provider: "others",
                },
                {
                    $set: {
                        status: "refunded",
                    },
                },
                {
                    new: true,
                    runValidators: true,
                    session,
                }
            );

            if (!updatedPayment) {
                throw new AppError("Payment status changed; refund could not be processed", 409);
            }

            const bookingResult = await Booking.updateOne(
                {
                    _id: booking._id,
                    bookingStatus: "cancelled",
                    paymentStatus: "completed",
                },
                {
                    $set: {
                        paymentStatus: "refunded",
                    },
                },
                {
                    runValidators: true,
                    session,
                }
            );

            if (bookingResult.matchedCount !== 1) {
                throw new AppError("Booking status changed; refund could not be completed", 409);
            }

            updatedBooking = {
                bookingId: booking.bookingId,
                bookingStatus: booking.bookingStatus,
                paymentStatus: "refunded",
            };
        });

        console.log(`Payment ${updatedPayment.paymentId} marked as refunded`);

        return response.success(res, "Payment marked as refunded successfully",
            {
                payment: {
                    paymentId: updatedPayment.paymentId,
                    status: updatedPayment.status,
                    amount: updatedPayment.amount,
                    currency: updatedPayment.currency,
                },
                booking: updatedBooking,
            }
        );
    } finally {
        await session.endSession();
    }
});