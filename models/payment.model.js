const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
    {
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking"
        },

        paymentId: {
            type: String,
            unique: true,
            required: true
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        amount: Number,

        paymentMethod: {
            type: String,
            enum: ["card", "upi", "netbanking", "cash"]
        },

        provider: {
            type: String,
            enum: ["razorpay", "stripe", "paypal","others"]
        },

        currency: {
            type: String,
            default: "INR"
        },

        transactionId: String,

        status: {
            type: String,
            enum: ["pending", "completed", "failed","refunded"],
            default: "pending"
        }

    },
    { timestamps: true }
);

const Payment = mongoose.model("Payment", PaymentSchema);

module.exports = { Payment };