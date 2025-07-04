import mongoose from 'mongoose';

// Keep minimal playlist model for tracking user-created playlists and AI generations
// This is mainly for analytics and user history, not for storage
const playlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['manual', 'ai'],
    required: true
  },
  // Store Spotify playlist ID instead of song references
  spotifyPlaylistId: {
    type: String,
    default: null
  },
  spotifyPlaylistUrl: {
    type: String,
    default: null
  },
  // Keep track of songs used for analytics
  songSpotifyIds: [{
    type: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  aiPrompt: {
    type: String,
    default: ''
  },
  aiExplanation: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  mood: {
    type: String,
    enum: ['Happy', 'Sad', 'Energetic', 'Calm', 'Romantic', 'Inspirational', 'Nostalgic']
  },
  // Track creation for analytics
  exported: {
    type: Boolean,
    default: false
  },
  exportedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
playlistSchema.index({ type: 1, createdAt: -1 });
playlistSchema.index({ mood: 1 });
playlistSchema.index({ exported: 1 });

export default mongoose.model('Playlist', playlistSchema);