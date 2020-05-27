const mongoose = require('mongoose');

const { Schema } = mongoose;

const locationSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
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
  image: {
    type: String,
    default: 'uploads/img_placeholder.png',
  },
});

locationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Location', locationSchema);
