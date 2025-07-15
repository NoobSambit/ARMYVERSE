import mongoose from 'mongoose';

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

export default mongoose.model('Playlist', playlistSchema);