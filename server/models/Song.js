import mongoose from 'mongoose';

// Simplified Song model for caching metadata and daily snapshots
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
    sparse: true,
    required: true
  },
  spotifyUri: {
    type: String,
    default: ''
  },
  album: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Album',
    required: true
  },
  // Daily snapshots for trend analysis
  dailySnapshots: [{
    date: { type: Date, required: true },
    streams: { type: Number, default: 0 },
    popularity: { type: Number, default: 0 }
  }],
  // Current cached stats (updated daily)
  currentStats: {
    spotify: {
      totalStreams: { type: Number, default: 0 },
      popularity: { type: Number, default: 0 },
      monthlyListeners: { type: Number, default: 0 }
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  // Cached metadata to avoid repeated API calls
  metadata: {
    thumbnail: { type: String, default: '' },
    duration: { type: Number, default: 0 }, // in seconds
    releaseDate: { type: Date, required: true },
    genres: [{
      type: String,
      enum: ['K-Pop', 'Hip-Hop', 'R&B', 'Pop', 'Rock', 'Ballad', 'Dance', 'Electronic']
    }],
    mood: {
      type: String,
      enum: ['Happy', 'Sad', 'Energetic', 'Calm', 'Romantic', 'Inspirational', 'Nostalgic']
    },
    isTitle: { type: Boolean, default: false },
    audioFeatures: {
      energy: { type: Number, default: 0 },
      valence: { type: Number, default: 0 },
      danceability: { type: Number, default: 0 },
      acousticness: { type: Number, default: 0 }
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
songSchema.index({ spotifyId: 1 });
songSchema.index({ 'currentStats.spotify.totalStreams': -1 });
songSchema.index({ 'currentStats.spotify.popularity': -1 });
songSchema.index({ 'dailySnapshots.date': -1 });

// Method to add daily snapshot
songSchema.methods.addDailySnapshot = function(streams, popularity) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if snapshot for today already exists
  const existingSnapshot = this.dailySnapshots.find(
    snapshot => snapshot.date.getTime() === today.getTime()
  );
  
  if (!existingSnapshot) {
    this.dailySnapshots.push({
      date: today,
      streams,
      popularity
    });
    
    // Keep only last 30 days
    this.dailySnapshots = this.dailySnapshots
      .sort((a, b) => b.date - a.date)
      .slice(0, 30);
  }
};

export default mongoose.model('Song', songSchema);