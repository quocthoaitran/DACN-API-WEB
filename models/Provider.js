const mongoose = require('mongoose');

const { Schema } = mongoose;

const ProviderSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  acronym: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('Provider', ProviderSchema);
