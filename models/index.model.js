const { User } = require("./user.model");
const { Event } = require("./event.model");
const { Booking } = require("./booking.model");
const { Category } = require("./category.model");
const { Review } = require("./review.model");
const { Notification } = require("./notification.model");
const { Payment } = require("./payment.model");

module.exports = {
  User,
  Event,
  Booking,
  Category,
  Review,
  Notification,
  Payment
};