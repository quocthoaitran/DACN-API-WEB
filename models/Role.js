const mongoose = require('mongoose');

const { Schema } = mongoose;

const roleSchema = new Schema({
  _id: {
    type: Number,
    default: 2,
  },
  name: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
