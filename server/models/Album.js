import mongoose from 'mongoose';

const albumSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  releaseDate: {
    type: Date,
    required: true
  },
  cover: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['Studio Album', 'EP', 'Single', 'Compilation', 'Live Album'],
    default: 'Studio Album'
  },
  songs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song'
  }],
  stats: {
    totalStreams: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 }
  },
  description: {
    type: String,
    default: ''
  },
  trackCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Virtual for calculating total streams
albumSchema.virtual('calculatedStats').get(function() {
  return {
    totalStreams: this.stats.totalStreams,
    songCount: this.songs.length
  };
});

export default mongoose.model('Album', albumSchema);