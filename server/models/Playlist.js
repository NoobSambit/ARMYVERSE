const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  theme: {
    type: String,
    required: true,
    trim: true
  },
  songs: [{
    type: String,
    required: true,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Playlist', playlistSchema);