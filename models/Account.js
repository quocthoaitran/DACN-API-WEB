const mongoose = require('mongoose');

const {
  Schema,
} = mongoose;

const accountSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    minlength: 6,
  },
  confirm_token: {
    type: String,
  },
  is_confirm: {
    type: Boolean,
    default: false,
  },
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true,
  },
  role: {
    type: Number,
    ref: 'Role',
    required: true,
  },
  type: {
    type: String,
    enum: ['email', 'social'],
    default: 'email',
  },
  status: {
    type: Boolean,
    default: true,
  },
  token: {
    type: String,
    default: true,
  },
  is_exp: {
    type: String,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Account', accountSchema);
