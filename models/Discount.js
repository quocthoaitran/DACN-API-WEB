const mongoose = require('mongoose');

const { Schema } = mongoose;

const discountSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['hotel', 'tour', 'all'],
    required: true,
  },
  percent: {
    type: Number,
    required: true,
  },
  creater: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
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
  date_start: {
    type: Date,
    required: true,
  },
  date_end: {
    type: Date,
    required: true,
  },
  status: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Discount', discountSchema);
