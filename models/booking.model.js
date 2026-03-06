const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
    {
        bookingId: {
            type: String,
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

        seats: [
            {
                seatNumber: String,
                row: String
            }
        ],

        totalAmount: Number,

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