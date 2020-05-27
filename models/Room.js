const mongoose = require('mongoose');

const { Schema } = mongoose;

const RoomSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  square: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['AVAILABLE', 'CLOSE'],
    default: 'AVAILABLE',
  },
  rate: {
    type: Number,
    default: 0,
  },
  num_review: {
    type: Number,
    default: 0,
  },
  beds: {
    type: Number,
    default: 1,
  },
  adults: {
    type: Number,
    default: 1,
  },
  children: {
    type: Number,
    default: 0,
  },
  price: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  images: {
    type: [String],
    required: true,
  },
  amenities: {
    type: [
      {
        icon: {
          type: String,
          default: 'uploads/ic_placeholder.png',
        },
        name: {
          type: String,
          require: true,
        },
        status: {
          type: Boolean,
          default: false,
        },
      },
    ],
    required: true,
  },
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
  },
});

module.exports = mongoose.model('Room', RoomSchema);
