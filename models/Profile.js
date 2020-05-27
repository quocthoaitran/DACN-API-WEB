const mongoose = require('mongoose');

const { Schema } = mongoose;

const profileSchema = new Schema({
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  birthday: {
    type: Date,
  },
  avatar: {
    type: String,
    default: 'uploads/img_avatar_placeholder.png',
  },
  gender: {
    type: Boolean,
  },
  address: {
    type: String,
  },
  email: {
    type: String,
    require: true,
  },
  phone_number: {
    type: String,
  },
  role: {
    type: String,
    required: true,
  },
  email_paypal: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);
