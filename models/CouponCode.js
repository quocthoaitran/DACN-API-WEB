const mongoose = require('mongoose');

const { Schema } = mongoose;

const couponCodeSchema = new Schema({
  type: {
    type: String,
    enum: ['hotel', 'tour'],
    required: true,
  },
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
  },
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
  },
  percent: {
    type: Number,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  creater: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true,
  },
  date_start: {
    type: Date,
    required: true,
  },
  date_end: {
    type: Date,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  available: {
    type: Number,
    default: 10,
  },
  status: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('CouponCode', couponCodeSchema);
