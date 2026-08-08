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
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    },

    location: {
        venueName: String,
        address: String,
        city: String,
        state: String,
        country: String,
        pincode: String,

        coordinates: {

            type: {
                type: String,
                enum: ["Point"],
                default: "Point"
            },

            coordinates: {
                type: [Number],
                default: [0, 0]
            }
        }
    },

    bannerImage: String,

    galleryImages: [String],

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
            },
            category: {
                type: String,
                enum: ["VIP", "Premium", "Regular"]
            },
        }
    ],

    approvalStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },

    isPaid: {
        type: Boolean,
        default: false
    },

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
EventSchema.index({ Date: 1 });
EventSchema.index({ category: 1 });
EventSchema.index({ "location.coordinates": "2dsphere" });

EventSchema.index({ title: "text", description: "text" });

const Event = mongoose.model("Event", EventSchema);
module.exports = { Event };