const mongoose = require('mongoose');

const { Schema } = mongoose;

const BookingSchema = new Schema({
  booking_list: {
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BookingItem',
        required: true,
      },
    ],
    required: true,
  },
  total_price: {
    type: Number,
    required: true,
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true,
  },
  status: {
    type: Boolean,
    default: false,
  },
  is_choose: {
    type: Boolean,
    default: true,
  },
  paymentID: {
    type: String,
    required: true,
  },
  payerID: {
    type: String,
  },
  token_paypal: {
    type: String,
    required: true,
  },
  url_paypal: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);
