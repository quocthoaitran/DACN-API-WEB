const mongoose = require('mongoose');

const { Schema } = mongoose;

const citySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  zipcode: {
    type: Number,
    required: true,
  },
  country: {
    type: String,
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
  acronym: {
    type: String,
  },
  image: {
    type: String,
    default: 'uploads/img_placeholder.png',
  },
  has_airport: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('City', citySchema);
