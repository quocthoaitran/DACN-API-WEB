const mongoose = require('mongoose');

const { Schema } = mongoose;

const resourceSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Resource', resourceSchema);
