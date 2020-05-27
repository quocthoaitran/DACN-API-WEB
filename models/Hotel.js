const mongoose = require('mongoose');

const { Schema } = mongoose;

const hotelSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  rate: {
    type: Number,
    default: 0,
  },
  num_review: {
    type: Number,
    default: 0,
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true,
  },
  facilities: {
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
  images: {
    type: [String],
    required: true,
  },
  rules: {
    type: [{
      name: {
        type: String,
        require: true,
      },
      content: {
        type: String,
        required: true,
      },
    }],
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  rooms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true,
  },
}, { timestamps: true });

hotelSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Hotel', hotelSchema);
