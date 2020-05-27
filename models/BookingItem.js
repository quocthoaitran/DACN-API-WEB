const mongoose = require('mongoose');

const { Schema } = mongoose;

const BookingItemSchema = new Schema({
  type: {
    type: String,
    enum: ['flight', 'room', 'tour'],
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  coupon_code: {
    type: String,
  },
  is_checkout: {
    type: Boolean,
    default: true,
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
  },
  flight: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flight',
  },
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
  },
  date_start: {
    type: Date,
  },
  date_end: {
    type: Date,
  },
  customers: {
    type: [
      {
        email: {
          type: String,
          required: true,
        },
        lastname: {
          type: String,
          required: true,
        },
        firstname: {
          type: String,
          required: true,
        },
        phone_number: {
          type: String,
          required: true,
        },
      },
    ],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('BookingItem', BookingItemSchema);
