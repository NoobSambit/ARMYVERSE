import mongoose from 'mongoose';

const songSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  artist: {
    type: String,
    default: 'BTS',
    trim: true
  },
  spotifyId: {
    type: String,
    unique: true,
    sparse: true
  },
  youtubeId: {
    type: String,
    unique: true,
    sparse: true
  },
  album: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Album',
    required: true
  },
  stats: {
    spotify: {
      dailyStreams: { type: Number, default: 0 },
      monthlyStreams: { type: Number, default: 0 },
      totalStreams: { type: Number, default: 0 },
      popularity: { type: Number, default: 0 }
    },
    youtube: {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      dailyViews: { type: Number, default: 0 }
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  thumbnail: {
    type: String,
    default: ''
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  releaseDate: {
    type: Date,
    required: true
  },
  genres: [{
    type: String,
    enum: ['K-Pop', 'Hip-Hop', 'R&B', 'Pop', 'Rock', 'Ballad', 'Dance', 'Electronic']
  }],
  mood: {
    type: String,
    enum: ['Happy', 'Sad', 'Energetic', 'Calm', 'Romantic', 'Inspirational', 'Nostalgic']
  },
  isTitle: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
songSchema.index({ 'stats.spotify.totalStreams': -1 });
songSchema.index({ 'stats.youtube.views': -1 });
songSchema.index({ title: 'text', artist: 'text' });

export default mongoose.model('Song', songSchema);