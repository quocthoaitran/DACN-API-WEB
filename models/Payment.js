const mongoose = require('mongoose');

const { Schema } = mongoose;

const PaymentSchema = new Schema({
  email_receiver: {
    type: String,
    required: true,
  },
  email_sender: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['BOOKING', 'PAY', 'REFUND'],
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  paymentID: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
