const mongoose = require('mongoose');

const { Schema } = mongoose;

const ReviewSchema = new Schema({
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  rate_star: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['room', 'hotel', 'tour'],
    required: true,
  },
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
  },
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
  },
}, { timestamps: true });

module.exports = mongoose.model('Review', ReviewSchema);
