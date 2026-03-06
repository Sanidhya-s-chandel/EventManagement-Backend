const { time } = require("console");
const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({

    eventId: {
        type: String,
        unique: true,
        required: true,
    },

    title: {
        type: String,
        required: true,
    },

    description: {
        type: String,
        required: true,
    },

    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    category: {
        type: String,
        required: true,
    },

    location: {
        type: String,
        required: true,
    },

    date: {
        type: Date,
        required: true,
    },

    time: {
        type: String,
        required: true,
    },

    totalSeats: {
        type: Number,
        required: true,
    },

    availableSeats: {
        type: Number,
        required: true,
    },

    seatLayout: [
        {
            seatNumber: String,
            row: String,
            price: Number,
            status: {
                type: String,
                enum: ["available", "reserved", "booked"],
                default: "available"
            }
        }
    ],

    price: {
        type: Number,
        required: true,
    },

    status: {
        type: String,
        enum: ["active", "cancelled", "completed"],
        default: "active",
    },

    attendees: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],

    timeSlots: [
        {
            startTime: Date,
            endTime: Date,
        }
    ],
});

EventSchema.index({ organizer: 1 });
EventSchema.index({ eventDate: 1 });
EventSchema.index({ category: 1 });

EventSchema.index({ title: "text", description: "text" });

const Event = mongoose.model("Event", EventSchema);
module.exports = { Event };