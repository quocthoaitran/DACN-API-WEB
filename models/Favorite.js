const mongoose = require('mongoose');

const { Schema } = mongoose;

const favoriteSchema = new Schema({
  type: {
    type: String,
    enum: ['hotel', 'tour'],
    required: true,
  },
  favorite_person: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true,
  },
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
  },
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
  },
}, { timestamps: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
