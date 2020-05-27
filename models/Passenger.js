const mongoose = require('mongoose');

const { Schema } = mongoose;

const PassengerSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  birthday: {
    type: Date,
    required: true,
    max: Date.now,
  },
  phone: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model('Passenger', PassengerSchema);
