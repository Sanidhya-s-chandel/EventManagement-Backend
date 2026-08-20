const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
    {
        bookingId: {
            type: String,
            required: true,
            unique: true
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true
        },

        paymentId: String,

        transactionId: String,

        seats: [
            {
                seatNumber: {
                    type: String,
                    required: true
                },
                row: {
                    type: String,
                    required: true
                },
                price: {
                    type: String,
                    required: true
                }
            }
        ],

        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },

        paymentStatus: {
            type: String,
            enum: ["pending", "completed", "failed"],
            default: "pending"
        },

        bookingStatus: {
            type: String,
            enum: ["confirmed", "cancelled"],
            default: "confirmed"
        },

        bookedAt: {
            type: Date,
            default: Date.now
        }

    },
    { timestamps: true }
);

BookingSchema.index({ user: 1 });
BookingSchema.index({ event: 1 });

const Booking = mongoose.model("Booking", BookingSchema);
module.exports = { Booking };