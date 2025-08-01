import mongoose from 'mongoose';

const playlistSchema = new mongoose.Schema({
  theme: {
    type: String,
    required: true,
    trim: true
  },
  songs: [{
    title: { type: String, required: true },
    artist: { type: String, required: true },
    album: { type: String, required: true },
    thumbnail: { type: String, required: true },
    duration: { type: Number, required: true },
    spotifyUrl: { type: String, required: true },
    spotifyId: { type: String },
    uri: { type: String }
  }],
  spotifyUrl: {
    type: String,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Playlist', playlistSchema);