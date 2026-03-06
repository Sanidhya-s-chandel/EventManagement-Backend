const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
{
  userId: {
    type: String,
    unique: true,
    required: [true, "User ID is required"],
  },

  firstName: {
    type: String,
    required: [true, "First name is required"],
  },

  lastName: {
    type: String,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/,
      "Please enter a valid email address",
    ],
  },

  phone: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: function () {
      return !this.isFromGoogle && this.isEmailVerified;
    },
  },

  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },

  isActive: {
    type: Boolean,
    default: true,
  },

  profileImage: {
    type: String,
  },

  dob: {
    type: Date,
  },

  gender: {
    type: String,
    enum: ["male", "female", "others"],
  },

  address: {
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    country: { type: String, default: "India" },
    pinCode: String,
  },

  otp: String,

  otpExpirationTime: Date,

  isEmailVerified: {
    type: Boolean,
    default: false,
  },

  isFromGoogle: {
    type: Boolean,
    default: false,
  },

  otpVerified: {
    type: Boolean,
    default: false,
  },

  // EVENTS CREATED (for organizers)
  createdEvents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    },
  ],

  // EVENTS BOOKED (for attendees)
  bookedEvents: [
    {
      event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
      bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
      },
      bookedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  // USER INTERACTIONS
  favoriteEvents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
    },
  ],

  searchHistory: [
    {
      query: String,
      searchedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  lastLogin: Date,

},
{ timestamps: true }
);

// UserSchema.index({ email: 1 });
// UserSchema.index({ phone: 1 });

const User = mongoose.model("User", UserSchema);

module.exports = { User };