const mongoose = require('mongoose');

const { Schema } = mongoose;

const MessageSchema = new Schema({
  partner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true,
  },
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true,
  },
  content: {
    type: String,
    required: true,
  },

}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
