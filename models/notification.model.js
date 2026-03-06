const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    title: String,

    message: String,

    type: {
      type: String,
      enum: ["booking", "event", "system"]
    },

    isRead: {
      type: Boolean,
      default: false
    }

  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", NotificationSchema);

module.exports = { Notification };