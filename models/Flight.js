const mongoose = require('mongoose');

const { Schema } = mongoose;

const FlightSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  start_location: {
    type: String,
    required: true,
  },
  end_location: {
    type: String,
    required: true,
  },
  time_start: {
    hour: Number,
    minute: Number,
  },
  time_end: {
    hour: Number,
    minute: Number,
  },
  price: {
    type: Number,
    required: true,
  },
  date_start: {
    type: Date,
    required: true,
    ref: 'City',
  },
  date_end: {
    type: Date,
    ref: 'City',
  },
  provider: {
    type: String,
    ref: 'Provider',
    required: true,
  },
  flight_id: {
    type: String,
    required: true,
  }
});

module.exports = mongoose.model('Flight', FlightSchema);
