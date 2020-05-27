const mongoose = require('mongoose');

const { Schema } = mongoose;

const actionSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Action', actionSchema);
