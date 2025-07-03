import mongoose from 'mongoose';

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
  songs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song'
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
  isPublic: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  mood: {
    type: String,
    enum: ['Happy', 'Sad', 'Energetic', 'Calm', 'Romantic', 'Inspirational', 'Nostalgic']
  },
  duration: {
    type: Number, // total duration in seconds
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
playlistSchema.index({ type: 1, createdAt: -1 });
playlistSchema.index({ mood: 1 });
playlistSchema.index({ tags: 1 });

export default mongoose.model('Playlist', playlistSchema);