const mongoose = require('mongoose');

const { Schema } = mongoose;

const attributeSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  resource: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Attribute', attributeSchema);
