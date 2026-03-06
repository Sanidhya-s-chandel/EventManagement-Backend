const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event"
        },

        rating: {
            type: Number,
            min: 1,
            max: 5
        },

        comment: String

    },
    { timestamps: true }
);

const Review = mongoose.model("Review", ReviewSchema);

module.exports = { Review };