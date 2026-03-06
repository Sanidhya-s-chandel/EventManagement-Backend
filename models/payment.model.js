const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
    {
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking"
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

        transactionId: String,

        status: {
            type: String,
            enum: ["pending", "completed", "failed"],
            default: "pending"
        }

    },
    { timestamps: true }
);

const Payment = mongoose.model("Payment", PaymentSchema);

module.exports = { Payment };