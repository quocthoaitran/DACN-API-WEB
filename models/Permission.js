const mongoose = require('mongoose');

const { Schema } = mongoose;

const PermissionSchema = new Schema({
  role: {
    type: Number,
    ref: 'Role',
    required: true,
  },
  resource: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  possession: {
    type: String,
    enum: ['own', 'any'],
    required: true,
  },
  attributes: {
    type: [
      {
        type: String,
        required: true,
      },
    ],
  },
}, { timestamps: true });

module.exports = mongoose.model('Permission', PermissionSchema);
