// Playlist model for MongoDB - Coming soon!
// This will define the schema for storing playlists

import mongoose from 'mongoose';

const playlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  prompt: {
    type: String,
    required: true
  },
  tracks: [{
    spotifyId: String,
    name: String,
    artist: String,
    album: String,
    duration: Number,
    popularity: Number,
    previewUrl: String
  }],
  userId: {
    type: String, // Will link to user authentication later
    required: false // For now, allowing anonymous playlists
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  tags: [String],
  mood: String,
  activity: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

playlistSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Playlist = mongoose.model('Playlist', playlistSchema);

export default Playlist;